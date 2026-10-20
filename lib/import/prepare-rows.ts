import {
  BARCODE_PATTERN,
  StockLimits,
  wholeQuantityUnits,
  type BaseUnit,
  type ItemInput,
} from "@/lib/api/stock"
import { parseQuantity } from "@/lib/forms/quantity"

import {
  ImportField,
  parseCategoryPath,
  parseUnit,
  parseYesNo,
  type ColumnMapping,
} from "./import-fields"
import { cellText, isBlank, type Table, type TableCell } from "./read-table"

/** Ce qui empêche d'importer une ligne ; le message est choisi par l'écran. */
export const RowProblem = {
  nameMissing: "nameMissing",
  nameTooLong: "nameTooLong",
  barcodeInvalid: "barcodeInvalid",
  barcodeDuplicate: "barcodeDuplicate",
  unitUnknown: "unitUnknown",
  categoryTooLong: "categoryTooLong",
  packagingIncomplete: "packagingIncomplete",
  packagingNameTooLong: "packagingNameTooLong",
  packagingQuantityInvalid: "packagingQuantityInvalid",
  batchTrackingInvalid: "batchTrackingInvalid",
  minQuantityInvalid: "minQuantityInvalid",
  descriptionTooLong: "descriptionTooLong",
  stockInvalid: "stockInvalid",
  batchMissing: "batchMissing",
  batchTooLong: "batchTooLong",
} as const
export type RowProblem = (typeof RowProblem)[keyof typeof RowProblem]

/** Une ligne du fichier, prête à partir ou écartée avec ses motifs. */
export type PreparedRow = {
  /** Numéro de la ligne dans le fichier, titres compris : celui qu'Excel affiche. */
  line: number
  cells: TableCell[]
  problems: RowProblem[]
  /** Identifiant choisi ici : renvoyé après une coupure, l'article n'est pas créé deux fois. */
  item: ItemInput & { id: string }
  /** Catégorie et ses parents, à retrouver ou créer avant l'import ; vide sans catégorie. */
  categoryPath: string[]
  /** Stock présent, en unité de base ; null sans stock de départ. */
  opening: { quantity: number; batch?: string } | null
}

export type PrepareContext = {
  /** Libellés des unités dans la langue de l'écran (« Mètre carré »). */
  unitLabels: Record<BaseUnit, string>
  /** Dépôts où les articles sont proposés, avec le seuil de la ligne. */
  warehouseIds: string[]
  /** Le stock de départ est posé (colonne présente, dépôt choisi, droit de correction). */
  withOpening: boolean
}

const DEFAULT_UNIT: BaseUnit = "PIECE"
/** Décimales gardées par l'API (stock-api, StockLimits.QUANTITY_FRACTION_DIGITS). */
const FRACTION_SCALE = 10_000
/** La ligne des titres est la première du fichier. */
const FIRST_DATA_LINE = 2

/** Nombre positif ou nul lu dans une case : 1,44 comme 1.44 ; null si illisible ou négatif. */
function quantityOf(cell: TableCell): number | null {
  const value = typeof cell === "number" ? cell : parseQuantity(cellText(cell))
  if (value === null || !Number.isFinite(value) || value < 0) return null
  return Math.round(value * FRACTION_SCALE) / FRACTION_SCALE
}

/**
 * Lignes du fichier contrôlées avec les mêmes règles que l'API ; une référence ou un code-barres
 * déjà vu plus haut dans le fichier est un doublon. Les refus du serveur (déjà pris dans le
 * catalogue) viendront au bilan.
 */
export function prepareRows(
  table: Table,
  mapping: ColumnMapping,
  context: PrepareContext
): PreparedRow[] {
  const barcodes = new Set<string>()
  return table.rows.map((cells, index) => {
    const problems: RowProblem[] = []
    const cell = (field: ImportField): TableCell => {
      const column = mapping[field]
      return column === null ? null : (cells[column] ?? null)
    }
    const text = (field: ImportField) => cellText(cell(field))
    const filled = (field: ImportField) => !isBlank(cell(field))

    const name = text(ImportField.name)
    if (!name) problems.push(RowProblem.nameMissing)
    else if (name.length > StockLimits.name)
      problems.push(RowProblem.nameTooLong)

    const barcode = text(ImportField.barcode)
    if (barcode && !BARCODE_PATTERN.test(barcode))
      problems.push(RowProblem.barcodeInvalid)
    if (barcode && barcodes.has(barcode))
      problems.push(RowProblem.barcodeDuplicate)
    if (barcode) barcodes.add(barcode)

    const unit = filled(ImportField.unit)
      ? parseUnit(text(ImportField.unit), context.unitLabels)
      : DEFAULT_UNIT
    if (!unit) problems.push(RowProblem.unitUnknown)
    const whole = wholeQuantityUnits.has(unit ?? DEFAULT_UNIT)

    const categoryPath = parseCategoryPath(text(ImportField.category))
    if (categoryPath.some((part) => part.length > StockLimits.name))
      problems.push(RowProblem.categoryTooLong)

    const packagingName = text(ImportField.packagingName)
    const hasPackagingQuantity = filled(ImportField.packagingQuantity)
    const packagingQuantity = quantityOf(cell(ImportField.packagingQuantity))
    if (!!packagingName !== hasPackagingQuantity)
      problems.push(RowProblem.packagingIncomplete)
    else if (packagingName) {
      if (packagingName.length > StockLimits.packagingName)
        problems.push(RowProblem.packagingNameTooLong)
      if (
        packagingQuantity === null ||
        packagingQuantity <= 0 ||
        (whole && !Number.isInteger(packagingQuantity))
      )
        problems.push(RowProblem.packagingQuantityInvalid)
    }

    const batchTracking = filled(ImportField.batchTracking)
      ? parseYesNo(text(ImportField.batchTracking))
      : false
    if (batchTracking === null) problems.push(RowProblem.batchTrackingInvalid)

    const minQuantity = filled(ImportField.minQuantity)
      ? quantityOf(cell(ImportField.minQuantity))
      : null
    if (filled(ImportField.minQuantity) && minQuantity === null)
      problems.push(RowProblem.minQuantityInvalid)

    const description = text(ImportField.description)
    if (description.length > StockLimits.description)
      problems.push(RowProblem.descriptionTooLong)

    let opening: PreparedRow["opening"] = null
    if (context.withOpening && filled(ImportField.stock)) {
      const quantity = quantityOf(cell(ImportField.stock))
      if (quantity === null || (whole && !Number.isInteger(quantity)))
        problems.push(RowProblem.stockInvalid)
      const batch = text(ImportField.batch)
      if (batch.length > StockLimits.batch)
        problems.push(RowProblem.batchTooLong)
      if (quantity && batchTracking && !batch)
        problems.push(RowProblem.batchMissing)
      if (quantity)
        opening = { quantity, batch: batchTracking ? batch : undefined }
    }

    return {
      line: index + FIRST_DATA_LINE,
      cells,
      problems,
      categoryPath,
      opening,
      item: {
        id: crypto.randomUUID(),
        name,
        barcode: barcode || undefined,
        baseUnit: unit ?? DEFAULT_UNIT,
        batchTracking: batchTracking ?? false,
        description: description || undefined,
        // Le conditionnement du fichier est celui qu'on manipule : proposé d'office partout (D36).
        packagings:
          packagingName && packagingQuantity
            ? [
                {
                  name: packagingName,
                  quantity: packagingQuantity,
                  defaultReceipt: true,
                  defaultIssue: true,
                },
              ]
            : [],
        warehouses: context.warehouseIds.map((warehouseId) => ({
          warehouseId,
          minQuantity,
          maxQuantity: null,
        })),
        categoryId: null,
      },
    }
  })
}
