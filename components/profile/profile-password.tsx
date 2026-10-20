"use client"

import { KeyRoundIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useAuth } from "react-oidc-context"

import { FormSection } from "@/components/catalog/form-section"
import { Button } from "@/components/ui/button"
import { AccountAction, startAccountAction } from "@/lib/auth/account-action"
import { Routes } from "@/lib/routes"

/**
 * Mot de passe (D46) : changé sur les écrans de connexion de Kreskala (Keycloak), qui demandent
 * d'abord l'actuel, puis reviennent ici.
 */
export function ProfilePassword({ email }: { email: string | null }) {
  const t = useTranslations("profile.password")
  const auth = useAuth()
  const locale = useLocale()
  return (
    <FormSection title={t("title")} description={t("description")}>
      <Button
        variant="outline"
        onClick={() =>
          void startAccountAction(
            auth,
            AccountAction.updatePassword,
            Routes.profile,
            locale,
            email ?? undefined
          )
        }
      >
        <KeyRoundIcon />
        {t("change")}
      </Button>
    </FormSection>
  )
}
