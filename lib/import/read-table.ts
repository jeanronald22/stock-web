/**
 * Lecture d'un fichier d'import (D36) : classeur Excel (.xlsx, première feuille) ou CSV, tel
 * qu'Excel l'enregistre en français (séparateur « ; », encodage Windows) ou en UTF-8.
 */

/** Valeur d'une case : le texte saisi, ou le nombre tel qu'Excel le garde (sans format local). */
export type TableCell = string | number | boolean | null

export type Table = { headers: string[]; rows: TableCell[][] }

export const ImportFileKind = { xlsx: "xlsx", csv: "csv" } as const
export type ImportFileKind =
  (typeof ImportFileKind)[keyof typeof ImportFileKind]

export const IMPORT_FILE_ACCEPT = ".xlsx,.csv"
/** Un catalogue de 5 000 références tient largement dans 5 Mo. */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024
/** Au-delà, mieux vaut découper le fichier (l'aperçu et l'import restent rapides). */
export const MAX_IMPORT_ROWS = 5000

/** Pourquoi un fichier ne peut pas être lu ; le message est choisi par l'écran. */
export const TableErrorCode = {
  unsupported: "unsupported",
  tooLarge: "tooLarge",
  unreadable: "unreadable",
  empty: "empty",
  tooManyRows: "tooManyRows",
} as const
export type TableErrorCode =
  (typeof TableErrorCode)[keyof typeof TableErrorCode]

export class TableError extends Error {
  constructor(readonly code: TableErrorCode) {
    super(code)
  }
}

export function fileKind(file: File): ImportFileKind | null {
  const name = file.name.toLowerCase()
  if (name.endsWith(`.${ImportFileKind.xlsx}`)) return ImportFileKind.xlsx
  if (name.endsWith(`.${ImportFileKind.csv}`)) return ImportFileKind.csv
  return null
}

export async function readTable(file: File): Promise<Table> {
  const kind = fileKind(file)
  if (!kind) throw new TableError(TableErrorCode.unsupported)
  if (file.size > MAX_IMPORT_FILE_BYTES)
    throw new TableError(TableErrorCode.tooLarge)
  let cells: TableCell[][]
  try {
    cells =
      kind === ImportFileKind.xlsx ? await readXlsx(file) : await readCsv(file)
  } catch {
    throw new TableError(TableErrorCode.unreadable)
  }
  const filled = cells.filter((row) => row.some((cell) => !isBlank(cell)))
  // La première ligne remplie porte les titres des colonnes.
  const [header, ...rows] = filled
  if (!header || rows.length === 0) throw new TableError(TableErrorCode.empty)
  if (rows.length > MAX_IMPORT_ROWS)
    throw new TableError(TableErrorCode.tooManyRows)
  return { headers: header.map((cell) => cellText(cell)), rows }
}

export function isBlank(cell: TableCell): boolean {
  return cell === null || (typeof cell === "string" && cell.trim() === "")
}

/** Texte d'une case, sans espaces autour ; vide pour une case vide. */
export function cellText(cell: TableCell): string {
  return cell === null ? "" : String(cell).trim()
}

async function readXlsx(file: File): Promise<TableCell[][]> {
  const { readSheet } = await import("read-excel-file/browser")
  const data = await readSheet(file)
  return data.map((row) =>
    row.map((cell) =>
      cell instanceof Date
        ? cell.toISOString().slice(0, 10)
        : typeof cell === "string" ||
            typeof cell === "number" ||
            typeof cell === "boolean"
          ? cell
          : null
    )
  )
}

const UTF8 = "utf-8"
/** Encodage des CSV enregistrés par Excel sous Windows en français. */
const WINDOWS_LATIN = "windows-1252"

async function readCsv(file: File): Promise<TableCell[][]> {
  const bytes = await file.arrayBuffer()
  let text: string
  try {
    text = new TextDecoder(UTF8, { fatal: true }).decode(bytes)
  } catch {
    text = new TextDecoder(WINDOWS_LATIN).decode(bytes)
  }
  const { default: Papa } = await import("papaparse")
  // Séparateur deviné (« ; » d'Excel en français, « , » ailleurs) ; marque d'ordre d'octets retirée.
  const parsed = Papa.parse<string[]>(text.replace(/^﻿/, ""), {
    skipEmptyLines: "greedy",
  })
  return parsed.data
}
