"use client"

import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { useAuth } from "react-oidc-context"

import { Splash } from "./splash"

/** Écrans réservés aux personnes connectées : sinon, direction la page de connexion. */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const t = useTranslations("common")
  const mustSignIn =
    !auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator

  useEffect(() => {
    if (mustSignIn) void auth.signinRedirect()
  }, [mustSignIn, auth])

  return auth.isAuthenticated ? children : <Splash label={t("loading")} />
}
