import type { AppLocale } from "@/i18n/locales"
import type messages from "@/messages/fr.json"

/** Clés de traduction vérifiées à la compilation, à partir du fichier français (langue de référence). */
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale
    Messages: typeof messages
  }
}
