import { LOCALE_COOKIE, type AppLocale } from "@/i18n/locales"

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/** Retient la langue choisie ; le serveur la lit au prochain rendu (i18n/request.ts). */
export function rememberLocale(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`
}
