/** « 1,44 » ou « 1.44 » : la virgule décimale française est acceptée. Renvoie null si illisible. */
export function parseQuantity(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".")
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  return Number(normalized)
}

/** Affichage dans un champ : 1.44 devient « 1,44 » en français. */
export function formatQuantityInput(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    useGrouping: false,
    maximumFractionDigits: 4,
  }).format(value)
}
