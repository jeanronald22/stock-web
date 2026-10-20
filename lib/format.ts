/** Initiales affichées dans les avatars : « Quincaillerie Ngono » → « QN ». */
export function initials(text: string, max = 2): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((word) => word[0]!.toLocaleUpperCase())
    .join("")
}

/** Chiffres groupés par deux en partant de la fin, comme on les dit au Cameroun : 6 99 12 34 56. */
const PHONE_GROUP = /(\d)(?=(\d{2})+$)/g

/**
 * Numéro international lisible : « +237699123456 » → « +237 6 99 12 34 56 ». Un numéro d'un autre
 * pays que [prefix] reste tel quel.
 */
export function formatPhone(e164: string, prefix: string): string {
  if (!e164.startsWith(prefix)) return e164
  return `${prefix} ${e164.slice(prefix.length).replace(PHONE_GROUP, "$1 ")}`
}
