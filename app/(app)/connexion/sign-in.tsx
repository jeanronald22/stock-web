"use client"

import { LockKeyholeIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { useAuth } from "react-oidc-context"

import { FullPageMessage } from "@/components/app/full-page-message"
import { HomeRedirect } from "@/components/app/home-redirect"

/**
 * La saisie du numéro et du code se fait sur les écrans Keycloak (thème Kreskala) : on y va
 * directement. Le bouton reste là si la redirection automatique échoue.
 */
export function SignIn() {
  const auth = useAuth()
  const t = useTranslations("signIn")
  const shouldRedirect =
    !auth.isLoading &&
    !auth.isAuthenticated &&
    !auth.activeNavigator &&
    !auth.error

  useEffect(() => {
    if (shouldRedirect) void auth.signinRedirect()
  }, [shouldRedirect, auth])

  if (auth.isAuthenticated) return <HomeRedirect />
  return (
    <FullPageMessage
      icon={LockKeyholeIcon}
      title={t("title")}
      description={t("description")}
      action={{ label: t("manual"), onClick: () => void auth.signinRedirect() }}
    />
  )
}
