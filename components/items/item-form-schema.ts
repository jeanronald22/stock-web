import { z } from "zod"

import {
  BARCODE_PATTERN,
  baseUnits,
  StockLimits,
  wholeQuantityUnits,
  type Item,
  type ItemInput,
} from "@/lib/api/stock"
import { formatQuantityInput, parseQuantity } from "@/lib/forms/quantity"

export type ItemFormMessages = {
  required: string
  tooLong: (max: number) => string
  invalidNumber: string
  positive: string
  wholeNumber: string
  duplicateName: string
  invalidBarcode: string
}

/** Règles du formulaire d'article : les mêmes que l'API, vérifiées avant l'envoi. */
export function itemFormSchema(messages: ItemFormMessages) {
  const text = (max: number) =>
    z.string().trim().max(max, messages.tooLong(max))
  return z
    .object({
      name: text(StockLimits.name).min(1, messages.required),
      barcode: z
        .string()
        .trim()
        .refine(
          (value) => !value || BARCODE_PATTERN.test(value),
          messages.invalidBarcode
        ),
      description: text(StockLimits.description),
      baseUnit: z.enum(baseUnits),
      batchTracking: z.boolean(),
      // Quantité saisie en texte : « 1,44 » doit rester tel quel pendant la frappe.
      packagings: z
        .array(
          z.object({
            name: text(StockLimits.packagingName).min(1, messages.required),
            quantity: z.string(),
            defaultReceipt: z.boolean(),
            defaultIssue: z.boolean(),
          })
        )
        .max(StockLimits.packagingsPerItem),
      categoryId: z.string().nullable(),
      // Seuil saisi en texte, vide : pas d'alerte dans ce dépôt.
      warehouses: z.array(
        z.object({ warehouseId: z.string(), minQuantity: z.string() })
      ),
    })
    .superRefine((values, context) => {
      const seen = new Set<string>()
      values.packagings.forEach((packaging, index) => {
        const quantity = parseQuantity(packaging.quantity)
        const issue = (field: "name" | "quantity", message: string) =>
          context.addIssue({
            code: "custom",
            path: ["packagings", index, field],
            message,
          })
        if (quantity === null) issue("quantity", messages.invalidNumber)
        else if (quantity <= 0) issue("quantity", messages.positive)
        else if (
          wholeQuantityUnits.has(values.baseUnit) &&
          !Number.isInteger(quantity)
        )
          issue("quantity", messages.wholeNumber)

        const name = packaging.name.trim().toLocaleLowerCase()
        if (name && seen.has(name)) issue("name", messages.duplicateName)
        seen.add(name)
      })
      values.warehouses.forEach((placement, index) => {
        // parseQuantity refuse aussi un nombre négatif.
        if (
          placement.minQuantity.trim() &&
          parseQuantity(placement.minQuantity) === null
        )
          context.addIssue({
            code: "custom",
            path: ["warehouses", index, "minQuantity"],
            message: messages.invalidNumber,
          })
      })
    })
}

export type ItemFormValues = z.infer<ReturnType<typeof itemFormSchema>>

export function toItemInput(values: ItemFormValues): ItemInput {
  return {
    name: values.name,
    barcode: values.barcode || undefined,
    description: values.description || undefined,
    baseUnit: values.baseUnit,
    batchTracking: values.batchTracking,
    packagings: values.packagings.map((packaging) => ({
      name: packaging.name,
      quantity: parseQuantity(packaging.quantity) ?? 0,
      defaultReceipt: packaging.defaultReceipt,
      defaultIssue: packaging.defaultIssue,
    })),
    warehouses: values.warehouses.map((placement) => ({
      warehouseId: placement.warehouseId,
      minQuantity: placement.minQuantity.trim()
        ? parseQuantity(placement.minQuantity)
        : null,
    })),
    categoryId: values.categoryId,
  }
}

/** Valeurs de départ : fiche existante, ou nouvel article proposé dans [defaultWarehouseIds]. */
export function itemFormDefaults(
  item: Item | undefined,
  defaultWarehouseIds: string[],
  locale: string
): ItemFormValues {
  return {
    name: item?.name ?? "",
    barcode: item?.barcode ?? "",
    description: item?.description ?? "",
    baseUnit: item?.baseUnit ?? "PIECE",
    batchTracking: item?.batchTracking ?? false,
    packagings: (item?.packagings ?? []).map((packaging) => ({
      name: packaging.name,
      quantity: formatQuantityInput(packaging.quantity, locale),
      defaultReceipt: packaging.defaultReceipt,
      defaultIssue: packaging.defaultIssue,
    })),
    categoryId: item?.categoryId ?? null,
    warehouses: item
      ? item.warehouses.map((placement) => ({
          warehouseId: placement.warehouseId,
          minQuantity:
            placement.minQuantity === null
              ? ""
              : formatQuantityInput(placement.minQuantity, locale),
        }))
      : defaultWarehouseIds.map((warehouseId) => ({
          warehouseId,
          minQuantity: "",
        })),
  }
}
