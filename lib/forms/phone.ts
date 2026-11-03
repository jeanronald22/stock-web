/** Chiffres et séparateurs usuels seulement, un « + » en tête : « 6 99 12 34 56 », « +237 699… ». */
const PHONE_CHARACTERS = /^\+?[\d\s.()-]+$/
/** Bornes de la forme internationale (E.164), indicatif compris. */
const MIN_DIGITS = 8
const MAX_DIGITS = 15

/**
 * Premier tri d'un numéro saisi (D50) : « abc » ou « 12 » se signalent dès la saisie. Le nombre
 * exact de chiffres dépend du pays : l'API le vérifie et son refus se place sur le champ.
 */
export function looksLikePhone(text: string): boolean {
  if (!PHONE_CHARACTERS.test(text)) return false
  const digits = text.replace(/\D/g, "").length
  return digits >= MIN_DIGITS && digits <= MAX_DIGITS
}
