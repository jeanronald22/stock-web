/**
 * Secteurs proposés à l'inscription. Le code est enregistré (stable, analysable) ; le libellé
 * vient des traductions (welcome.sectors).
 */
export const sectorCodes = [
  "HARDWARE",
  "BUILDING_MATERIALS",
  "FOOD",
  "PHARMACY",
  "COSMETICS",
  "ELECTRONICS",
  "CLOTHING",
  "OTHER",
] as const
export type SectorCode = (typeof sectorCodes)[number]

/** Pays ouverts (référentiel platform.country de l'API). */
export const countryCodes = ["CM"] as const
export type CountryCode = (typeof countryCodes)[number]
export const defaultCountry: CountryCode = countryCodes[0]

/** Suggestions de saisie, sans limiter le choix : toute ville reste acceptée. */
export const citySuggestions: Record<CountryCode, readonly string[]> = {
  CM: [
    "Douala",
    "Yaoundé",
    "Bafoussam",
    "Bamenda",
    "Garoua",
    "Maroua",
    "Ngaoundéré",
    "Bertoua",
    "Limbé",
    "Kribi",
    "Ebolowa",
    "Buea",
    "Kumba",
    "Edéa",
    "Dschang",
    "Nkongsamba",
  ],
}
