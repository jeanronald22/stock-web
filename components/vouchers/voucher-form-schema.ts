import { z } from "zod"

import {
  wholeQuantityUnits,
  type BaseUnit,
  type Item,
  type Packaging,
} from "@/lib/api/stock"
import {
  VoucherLimits,
  VoucherType,
  type EntryType,
  type VoucherInput,
} from "@/lib/api/vouchers"
import { parseQuantity } from "@/lib/forms/quantity"

/** Unité d'une ligne : « » pour l'unité de base, sinon le nom d'un conditionnement de l'article. */
export const BASE_UNIT_CHOICE = ""

export type VoucherFormMessages = {
  required: string
  tooLong: (max: number) => string
  invalidNumber: string
  positive: string
  wholeNumber: string
  batchRequired: string
  linesRequired: string
  futureDate: string
}

/** Copie de l'article choisi, pour convertir et vérifier la saisie sans relire l'API. */
const itemSnapshot = z.object({
  name: z.string(),
  imageUrl: z.string().nullable(),
  baseUnit: z.custom<BaseUnit>(),
  batchTracking: z.boolean(),
  packagings: z.custom<Packaging[]>(),
})

export function voucherFormSchema(
  messages: VoucherFormMessages,
  today: string,
  transfer = false
) {
  const text = (max: number) =>
    z.string().trim().max(max, messages.tooLong(max))
  return z
    .object({
      warehouseId: z.string().min(1, messages.required),
      // Envoi de transfert : le dépôt d'arrivée, autre que celui de départ.
      destinationWarehouseId: z.string(),
      // Réception : fournisseur de l'annuaire (son nom remplace le champ libre).
      supplier: z.custom<{ id: string; name: string } | null>(),
      lines: z
        .array(
          z.object({
            key: z.string(),
            itemId: z.string(),
            item: itemSnapshot,
            quantity: z.string(),
            unit: z.string(),
            batch: text(VoucherLimits.batch),
          })
        )
        .min(1, messages.linesRequired)
        .max(VoucherLimits.lines),
      counterparty: text(VoucherLimits.counterparty),
      documentReference: text(VoucherLimits.documentReference),
      note: text(VoucherLimits.note),
      // Date du dépôt (AAAA-MM-JJ), comparable en texte.
      occurredOn: z
        .string()
        .refine((date) => date <= today, messages.futureDate),
    })
    .superRefine((values, context) => {
      if (transfer && !values.destinationWarehouseId)
        context.addIssue({
          code: "custom",
          path: ["destinationWarehouseId"],
          message: messages.required,
        })
      values.lines.forEach((line, index) => {
        const issue = (field: "quantity" | "batch", message: string) =>
          context.addIssue({
            code: "custom",
            path: ["lines", index, field],
            message,
          })
        const entered = parseQuantity(line.quantity)
        if (entered === null) return issue("quantity", messages.invalidNumber)
        if (entered <= 0) return issue("quantity", messages.positive)
        const base = baseQuantity(line.item, entered, line.unit)
        if (
          wholeQuantityUnits.has(line.item.baseUnit) &&
          !Number.isInteger(base)
        )
          issue("quantity", messages.wholeNumber)
        if (line.item.batchTracking && !line.batch.trim())
          issue("batch", messages.batchRequired)
      })
    })
}

export type VoucherFormValues = z.infer<ReturnType<typeof voucherFormSchema>>
export type VoucherFormLine = VoucherFormValues["lines"][number]

/** Quantité en unité de base : « 3 Carton » de 12 pièces donne 36. */
export function baseQuantity(
  item: Pick<Item, "packagings">,
  entered: number,
  unit: string
): number {
  const packaging = item.packagings.find((candidate) => candidate.name === unit)
  // Arrondi à 4 décimales, comme l'API : 3 × 1,44 ne doit pas donner 4,319999…
  return packaging
    ? Math.round(entered * packaging.quantity * 10_000) / 10_000
    : entered
}

export function newLine(item: Item): VoucherFormLine {
  return {
    key: crypto.randomUUID(),
    itemId: item.id,
    item: {
      name: item.name,
      imageUrl: item.imageUrl,
      baseUnit: item.baseUnit,
      batchTracking: item.batchTracking,
      packagings: item.packagings,
    },
    quantity: "",
    unit: BASE_UNIT_CHOICE,
    batch: "",
  }
}

/** Date du jour au dépôt, au format des champs de date (AAAA-MM-JJ). */
export function todayOn(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}

export function toVoucherInput(
  type: EntryType,
  values: VoucherFormValues,
  today: string
): VoucherInput {
  return {
    type,
    warehouseId: values.warehouseId,
    supplierId: type === VoucherType.receipt ? values.supplier?.id : undefined,
    // Aujourd'hui : l'API date l'opération de l'enregistrement. Un autre jour : midi, heure locale.
    occurredAt:
      values.occurredOn === today
        ? undefined
        : new Date(`${values.occurredOn}T12:00:00`).toISOString(),
    counterparty: values.counterparty || undefined,
    documentReference: values.documentReference || undefined,
    note: values.note || undefined,
    destinationWarehouseId:
      type === VoucherType.transferOut
        ? values.destinationWarehouseId
        : undefined,
    lines: values.lines.map((line) => ({
      itemId: line.itemId,
      quantity: parseQuantity(line.quantity) ?? 0,
      packagingName: line.unit === BASE_UNIT_CHOICE ? undefined : line.unit,
      batch: line.item.batchTracking ? line.batch.trim() : undefined,
    })),
  }
}
