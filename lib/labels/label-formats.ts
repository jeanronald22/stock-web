/**
 * Formats d'étiquettes (D36), en millimètres : planches A4 du commerce (sans marge entre les
 * étiquettes), ou rouleau d'imprimante thermique, une étiquette par page.
 */
export const LabelFormatId = {
  sheet24: "A4_24",
  sheet40: "A4_40",
  roll: "ROLL_50X30",
} as const
export type LabelFormatId = (typeof LabelFormatId)[keyof typeof LabelFormatId]

export type LabelFormat = {
  id: LabelFormatId
  page: { width: number; height: number }
  columns: number
  rows: number
  label: { width: number; height: number }
  /** Marges de la planche : les étiquettes y sont centrées. */
  margin: { top: number; left: number }
  /** Taille du nom ; les autres textes en découlent. */
  nameSize: number
  /** Une planche peut avoir servi : on commence à l'étiquette choisie. */
  sheet: boolean
}

const A4 = { width: 210, height: 297 }

export const LABEL_FORMATS: Record<LabelFormatId, LabelFormat> = {
  [LabelFormatId.sheet24]: {
    id: LabelFormatId.sheet24,
    page: A4,
    columns: 3,
    rows: 8,
    label: { width: 70, height: 37 },
    margin: { top: 0.5, left: 0 },
    nameSize: 9,
    sheet: true,
  },
  [LabelFormatId.sheet40]: {
    id: LabelFormatId.sheet40,
    page: A4,
    columns: 4,
    rows: 10,
    label: { width: 52.5, height: 29.7 },
    margin: { top: 0, left: 0 },
    nameSize: 7.5,
    sheet: true,
  },
  [LabelFormatId.roll]: {
    id: LabelFormatId.roll,
    page: { width: 50, height: 30 },
    columns: 1,
    rows: 1,
    label: { width: 50, height: 30 },
    margin: { top: 0, left: 0 },
    nameSize: 8,
    sheet: false,
  },
}

export function labelsPerPage(format: LabelFormat): number {
  return format.columns * format.rows
}

/** Points PDF par millimètre (72 points par pouce). */
export const PT_PER_MM = 72 / 25.4
