/** Langues de l'application (DECISIONS.md, D2). La première est la langue par défaut. */
export const locales = ["fr", "en"] as const
export type AppLocale = (typeof locales)[number]
export const defaultLocale: AppLocale = locales[0]

/** Cookie posé quand la personne choisit sa langue ; sinon, celle du navigateur s'applique. */
export const LOCALE_COOKIE = "NEXT_LOCALE"

export function isAppLocale(value: string | undefined): value is AppLocale {
  return locales.includes(value as AppLocale)
}

/** Première langue prise en charge dans l'en-tête Accept-Language (« fr-CM,fr;q=0.9,en;q=0.8 »). */
export function negotiateLocale(acceptLanguage: string | null): AppLocale {
  const requested = (acceptLanguage ?? "")
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
  return requested.find(isAppLocale) ?? defaultLocale
}
