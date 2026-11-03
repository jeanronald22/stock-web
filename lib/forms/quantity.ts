/** « 1,44 » ou « 1.44 » : la virgule décimale française est acceptée. Renvoie null si illisible. */
export function parseQuantity(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".")
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  return Number(normalized)
}

/** « -5 » ou « −1,5 » : un nombre lisible mais négatif, à signaler comme tel plutôt qu'illisible. */
export function isNegativeQuantity(text: string): boolean {
  return /^[-−]\d+([.,]\d+)?$/.test(text.replace(/\s/g, ""))
}

/** Affichage dans un champ : 1.44 devient « 1,44 » en français. */
export function formatQuantityInput(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    useGrouping: false,
    maximumFractionDigits: 4,
  }).format(value)
}
