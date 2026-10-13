"use client"

import { KeyRoundIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "react-oidc-context"

import { FullPageMessage } from "@/components/app/full-page-message"
import { HomeRedirect } from "@/components/app/home-redirect"
import { Splash } from "@/components/app/splash"

/** Retour de Keycloak : AuthProvider échange le code contre les jetons, puis on oriente la personne. */
export default function SignInCallbackPage() {
  const auth = useAuth()
  const t = useTranslations("callback")

  if (auth.error) {
    return (
      <FullPageMessage
        icon={KeyRoundIcon}
        title={t("failedTitle")}
        description={t("failedDescription")}
        action={{ label: t("restart"), onClick: () => void auth.signinRedirect() }}
      />
    )
  }
  return auth.isAuthenticated ? <HomeRedirect /> : <Splash label={t("label")} />
}
