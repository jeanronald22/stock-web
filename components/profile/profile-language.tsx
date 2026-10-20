"use client"

import { useLocale, useTranslations } from "next-intl"

import { FormSection } from "@/components/catalog/form-section"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { isAppLocale, locales } from "@/i18n/locales"

import { useSwitchLocale } from "./use-switch-locale"

/** Langue de l'application, des e-mails et des avis (D46), changée aussitôt. */
export function ProfileLanguage() {
  const t = useTranslations()
  const locale = useLocale()
  const switchLocale = useSwitchLocale()
  return (
    <FormSection
      title={t("profile.language.title")}
      description={t("profile.language.description")}
    >
      <ToggleGroup
        aria-label={t("profile.language.title")}
        variant="outline"
        value={[locale]}
        onValueChange={(values: string[]) => {
          const [next] = values
          if (next && next !== locale && isAppLocale(next)) switchLocale(next)
        }}
      >
        {locales.map((option) => (
          <ToggleGroupItem key={option} value={option} className="px-4">
            {t(`languages.${option}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FormSection>
  )
}
