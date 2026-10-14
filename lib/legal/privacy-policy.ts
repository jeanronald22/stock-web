import type { AppLocale } from "@/i18n/locales"
import type { LegalDocumentContent } from "@/lib/legal/legal-document"
import { privacyPolicyEn } from "@/content/legal/privacy-policy.en"
import { privacyPolicyFr } from "@/content/legal/privacy-policy.fr"

/**
 * Version publiée de la politique. À chaque fonctionnalité qui traite de nouvelles données, la
 * politique est complétée dans les deux langues, puis la version et la date sont avancées (D18).
 */
export const PrivacyPolicyRelease = {
  version: "0.4",
  updatedOn: "2026-10-14",
} as const

export const privacySectionIds = [
  "responsable",
  "donnees",
  "finalites",
  "appareil",
  "destinataires",
  "hebergement",
  "conservation",
  "securite",
  "droits",
  "mineurs",
  "modifications",
] as const
export type PrivacySectionId = (typeof privacySectionIds)[number]

export type PrivacyPolicyContent = LegalDocumentContent<PrivacySectionId>

const policies: Record<AppLocale, PrivacyPolicyContent> = {
  fr: privacyPolicyFr,
  en: privacyPolicyEn,
}

export function privacyPolicy(locale: AppLocale): PrivacyPolicyContent {
  return policies[locale]
}
