import type { Row } from "write-excel-file/browser"

import type { TableCell } from "./read-table"

/** Largeur des colonnes des classeurs produits, en caractères. */
const COLUMN_WIDTH = 22
const BOLD = "bold"

/** Une feuille du classeur : son nom (onglet d'Excel), ses titres, ses lignes. */
export type WorkbookSheet = {
  name: string
  headers: string[]
  rows: TableCell[][]
}

/** Excel refuse un nom d'onglet de plus de 31 caractères. */
const SHEET_NAME_MAX = 31

/**
 * Classeur Excel, titres en gras, enregistré sur l'appareil. La bibliothèque n'est chargée qu'au
 * premier fichier produit.
 */
export async function downloadWorkbook(
  fileName: string,
  sheets: WorkbookSheet[]
) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser")
  await writeXlsxFile(
    sheets.map((sheet) => ({
      sheet: sheet.name.slice(0, SHEET_NAME_MAX),
      data: [
        sheet.headers.map((value) => ({ value, fontWeight: BOLD })),
        ...sheet.rows.map((row) => row.map((value) => value ?? undefined)),
      ] satisfies Row[],
      columns: sheet.headers.map(() => ({ width: COLUMN_WIDTH })),
    }))
  ).toFile(fileName)
}
