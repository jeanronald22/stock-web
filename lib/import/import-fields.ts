import type { BaseUnit } from "@/lib/api/stock"

/**
 * Colonnes qu'un fichier d'import peut porter (D36). Seul le nom est obligatoire ; le reste prend
 * une valeur par défaut (pièce, pas de catégorie, pas de suivi par lot…).
 */
export const ImportField = {
  name: "name",
  reference: "reference",
  barcode: "barcode",
  unit: "unit",
  category: "category",
  packagingName: "packagingName",
  packagingQuantity: "packagingQuantity",
  batchTracking: "batchTracking",
  minQuantity: "minQuantity",
  description: "description",
  stock: "stock",
  batch: "batch",
} as const
export type ImportField = (typeof ImportField)[keyof typeof ImportField]

/** Ordre d'affichage et du modèle à télécharger. */
export const IMPORT_FIELDS: readonly ImportField[] = Object.values(ImportField)

export const REQUIRED_FIELDS: ReadonlySet<ImportField> = new Set([
  ImportField.name,
])

/** Colonnes du stock de départ : elles demandent un dépôt et le droit de correction. */
export const OPENING_FIELDS: ReadonlySet<ImportField> = new Set([
  ImportField.stock,
  ImportField.batch,
])

/** Minuscules, sans accents ni ponctuation : « Code-barres » et « code barres » se valent. */
export function normalizeLabel(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9²³]+/g, " ")
    .trim()
}

/**
 * Titres de colonne reconnus, déjà normalisés : ceux du modèle, puis ceux qu'on trouve dans les
 * fichiers Excel tenus à la main ou exportés d'un autre logiciel.
 */
const FIELD_ALIASES: Record<ImportField, readonly string[]> = {
  name: [
    "nom",
    "nom de l article",
    "designation",
    "libelle",
    "article",
    "produit",
    "name",
    "item",
    "description article",
  ],
  reference: [
    "reference",
    "ref",
    "reference article",
    "code article",
    "code produit",
    "code",
    "sku",
  ],
  barcode: [
    "code barres",
    "code barre",
    "codebarre",
    "codebarres",
    "ean",
    "ean13",
    "gtin",
    "upc",
    "barcode",
  ],
  unit: [
    "unite",
    "unite de base",
    "unite de stock",
    "unite de mesure",
    "um",
    "unit",
  ],
  category: [
    "categorie",
    "famille",
    "sous famille",
    "rayon",
    "groupe",
    "category",
  ],
  packagingName: [
    "conditionnement",
    "emballage",
    "colis",
    "packaging",
    "package",
  ],
  packagingQuantity: [
    "quantite par conditionnement",
    "qte par conditionnement",
    "quantite par carton",
    "pieces par carton",
    "par conditionnement",
    "colisage",
    "pcb",
    "units per package",
    "quantity per package",
  ],
  batchTracking: [
    "suivi par lot",
    "suivi lot",
    "suivi des lots",
    "par lot",
    "batch tracking",
  ],
  minQuantity: [
    "seuil d alerte",
    "seuil",
    "stock minimum",
    "stock mini",
    "stock min",
    "minimum",
    "alert threshold",
  ],
  description: ["description", "note", "notes", "remarque", "commentaire"],
  stock: [
    "stock actuel",
    "stock",
    "quantite en stock",
    "qte en stock",
    "qte stock",
    "stock initial",
    "stock de depart",
    "quantite",
    "qte",
    "on hand",
    "stock on hand",
    "quantity",
  ],
  batch: ["lot", "numero de lot", "n de lot", "no lot", "batch"],
}

/**
 * Colonne du fichier pour chaque champ, d'après les titres ; un titre ne sert qu'une fois.
 * null : la colonne n'est pas importée.
 */
export type ColumnMapping = Record<ImportField, number | null>

export function autoMap(headers: readonly string[]): ColumnMapping {
  const normalized = headers.map(normalizeLabel)
  const used = new Set<number>()
  return Object.fromEntries(
    IMPORT_FIELDS.map((field) => {
      const column = normalized.findIndex(
        (header, index) =>
          !used.has(index) && FIELD_ALIASES[field].includes(header)
      )
      if (column >= 0) used.add(column)
      return [field, column >= 0 ? column : null]
    })
  ) as ColumnMapping
}

/** Unités reconnues dans le fichier, normalisées ; s'y ajoutent les libellés de l'application. */
const UNIT_ALIASES: Record<BaseUnit, readonly string[]> = {
  PIECE: [
    "piece",
    "pieces",
    "pce",
    "pces",
    "pc",
    "pcs",
    "u",
    "unite",
    "unites",
    "unit",
    "each",
    "ea",
  ],
  KILOGRAM: [
    "kg",
    "kgs",
    "kilo",
    "kilos",
    "kilogramme",
    "kilogrammes",
    "kilogram",
  ],
  LITRE: ["l", "lt", "litre", "litres", "liter", "liters"],
  METRE: ["m", "ml", "metre", "metres", "metre lineaire", "meter", "meters"],
  SQUARE_METRE: ["m2", "m²", "metre carre", "metres carres", "square meter"],
  CUBIC_METRE: ["m3", "m³", "metre cube", "metres cubes", "cubic meter"],
}

/** Unité lue dans le fichier ; [labels] : libellés de l'application (« Mètre carré »). */
export function parseUnit(
  text: string,
  labels: Record<BaseUnit, string>
): BaseUnit | null {
  const value = normalizeLabel(text)
  const units = Object.keys(UNIT_ALIASES) as BaseUnit[]
  return (
    units.find(
      (unit) =>
        UNIT_ALIASES[unit].includes(value) ||
        normalizeLabel(labels[unit]) === value
    ) ?? null
  )
}

const YES = ["oui", "o", "yes", "y", "x", "1", "vrai", "true"]
const NO = ["non", "n", "no", "0", "faux", "false"]

/** « Oui », « x », « 1 »… ; null si ce n'est ni oui ni non. */
export function parseYesNo(text: string): boolean | null {
  const value = normalizeLabel(text)
  if (YES.includes(value)) return true
  if (NO.includes(value)) return false
  return null
}

/** « Carrelage > Sol » ou « Carrelage / Sol » : la catégorie et ses parents, de la racine à elle. */
export function parseCategoryPath(text: string): string[] {
  return text
    .split(/[>/›]/)
    .map((part) => part.trim())
    .filter(Boolean)
}
