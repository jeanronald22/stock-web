import { z } from "zod"

import {
  defaultPackaging,
  wholeQuantityUnits,
  type BaseUnit,
  type Item,
  type Packaging,
} from "@/lib/api/stock"
import type { CustomerKind } from "@/lib/api/customers"
import {
  correctionTypes,
  customerTypes,
  entryDirectionOf,
  OTHER_REASON,
  supplierTypes,
  VoucherLimits,
  VoucherType,
  type EntryType,
  type VoucherInput,
  type VoucherReason,
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
  reasonRequired: string
  noteRequired: string
  exceedsOrigin: string
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
  type: EntryType
) {
  const transfer = type === VoucherType.transferOut
  const correction = correctionTypes.has(type)
  // Seul un comptage peut trouver zéro ; une autre ligne déplace une quantité.
  const zeroAllowed = type === VoucherType.adjustment
  const text = (max: number) =>
    z.string().trim().max(max, messages.tooLong(max))
  return z
    .object({
      warehouseId: z.string().min(1, messages.required),
      // Envoi de transfert : le dépôt d'arrivée, autre que celui de départ.
      destinationWarehouseId: z.string(),
      // Réception : fournisseur de l'annuaire (son nom remplace le champ libre).
      supplier: z.custom<{ id: string; name: string } | null>(),
      // Sortie, retour client : le client ou chantier de l'annuaire (D30).
      customer: z.custom<{
        id: string
        name: string
        kind: CustomerKind
      } | null>(),
      // Retour : le bon dont il part, vide pour un retour libre.
      originId: z.string(),
      lines: z
        .array(
          z.object({
            key: z.string(),
            itemId: z.string(),
            item: itemSnapshot,
            quantity: z.string(),
            unit: z.string(),
            batch: text(VoucherLimits.batch),
            // Réception : quantité annoncée par le bon de livraison, vide si non saisie.
            expected: z.string(),
            // Retour depuis un bon : ce qui reste à retourner, en unité de base (D31).
            limit: z.number().nullable(),
            // Réception d'un article suivi par lot : nuance et calibre du lot (D35).
            shade: text(VoucherLimits.batchTrait),
            caliber: text(VoucherLimits.batchTrait),
          })
        )
        .min(1, messages.linesRequired)
        .max(VoucherLimits.lines),
      // Casse et ajustement : le motif (vide pour les autres bons).
      reason: z.string(),
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
      if (correction && !values.reason)
        context.addIssue({
          code: "custom",
          path: ["reason"],
          message: messages.reasonRequired,
        })
      if (correction && values.reason === OTHER_REASON && !values.note.trim())
        context.addIssue({
          code: "custom",
          path: ["note"],
          message: messages.noteRequired,
        })
      values.lines.forEach((line, index) => {
        const issue = (
          field: "quantity" | "batch" | "expected",
          message: string
        ) =>
          context.addIssue({
            code: "custom",
            path: ["lines", index, field],
            message,
          })
        const entered = parseQuantity(line.quantity)
        if (entered === null) return issue("quantity", messages.invalidNumber)
        if (entered <= 0 && !(zeroAllowed && entered === 0))
          return issue("quantity", messages.positive)
        const whole = (value: number) =>
          !wholeQuantityUnits.has(line.item.baseUnit) ||
          Number.isInteger(baseQuantity(line.item, value, line.unit))
        if (!whole(entered)) issue("quantity", messages.wholeNumber)
        if (
          line.limit !== null &&
          baseQuantity(line.item, entered, line.unit) > line.limit
        )
          issue("quantity", messages.exceedsOrigin)
        if (line.expected.trim()) {
          const expected = parseQuantity(line.expected)
          if (expected === null) issue("expected", messages.invalidNumber)
          else if (!whole(expected)) issue("expected", messages.wholeNumber)
        }
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

/** Ligne proposée par un bon d'origine (retour) : lot imposé, plafond et quantité pré-remplie. */
export type LinePreset = { batch: string; limit: number; quantity: string }

/**
 * Nouvelle ligne pour [item] sur un bon de [type] : dans le conditionnement proposé d'office pour
 * ce sens (D36), sauf ligne reprise d'un bon d'origine, dont la quantité est en unité de base.
 */
export function newLine(
  item: Item,
  type: EntryType,
  preset?: LinePreset
): VoucherFormLine {
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
    quantity: preset?.quantity ?? "",
    unit: preset
      ? BASE_UNIT_CHOICE
      : (defaultPackaging(item.packagings, entryDirectionOf(type))?.name ??
        BASE_UNIT_CHOICE),
    batch: preset?.batch ?? "",
    expected: "",
    limit: preset?.limit ?? null,
    shade: "",
    caliber: "",
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
    // Depuis un bon, le tiers est repris de ce bon par l'API.
    supplierId:
      supplierTypes.has(type) && !values.originId
        ? values.supplier?.id
        : undefined,
    customerId:
      customerTypes.has(type) && !values.originId
        ? values.customer?.id
        : undefined,
    originVoucherId: values.originId || undefined,
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
    reason: correctionTypes.has(type)
      ? (values.reason as VoucherReason)
      : undefined,
    lines: values.lines.map((line) => ({
      itemId: line.itemId,
      quantity: parseQuantity(line.quantity) ?? 0,
      packagingName: line.unit === BASE_UNIT_CHOICE ? undefined : line.unit,
      batch: line.item.batchTracking ? line.batch.trim() : undefined,
      expectedQuantity:
        type === VoucherType.receipt && line.expected.trim()
          ? (parseQuantity(line.expected) ?? undefined)
          : undefined,
      ...(type === VoucherType.receipt && line.item.batchTracking
        ? {
            shade: line.shade.trim() || undefined,
            caliber: line.caliber.trim() || undefined,
          }
        : {}),
    })),
  }
}
