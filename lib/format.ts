/** Initiales affichées dans les avatars : « Quincaillerie Ngono » → « QN ». */
export function initials(text: string, max = 2): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((word) => word[0]!.toLocaleUpperCase())
    .join("")
}
