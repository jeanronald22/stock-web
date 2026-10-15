import type { TableCell } from "./read-table"

/** Largeur des colonnes des classeurs produits, en caractères. */
const COLUMN_WIDTH = 22
const BOLD = "bold"

/**
 * Classeur Excel d'une seule feuille, titres en gras, enregistré sur l'appareil. La bibliothèque
 * n'est chargée qu'au premier fichier produit.
 */
export async function downloadWorkbook(
  fileName: string,
  headers: string[],
  rows: TableCell[][]
) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser")
  await writeXlsxFile(
    [
      headers.map((value) => ({ value, fontWeight: BOLD })),
      ...rows.map((row) => row.map((value) => value ?? undefined)),
    ],
    { columns: headers.map(() => ({ width: COLUMN_WIDTH })) }
  ).toFile(fileName)
}
