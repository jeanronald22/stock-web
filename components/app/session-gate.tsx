"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "react-oidc-context"

import { useTokenRenewal } from "@/lib/auth/token-renewal"
import { useOnline } from "@/lib/offline/use-online"

import { Splash } from "./splash"

/**
 * Écrans réservés aux personnes connectées : sinon, direction la page de connexion. Hors ligne
 * (D39), la session gardée sur le téléphone suffit, même si son jeton d'accès a expiré : il sera
 * renouvelé au retour du réseau.
 */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const t = useTranslations("common")
  const online = useOnline()
  const renew = useTokenRenewal()
  const offlineSession = !online && !!auth.user
  const mustSignIn =
    online && !auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator
  const expired = online && !auth.isLoading && !!auth.user?.expired
  // Un seul essai de renouvellement par retour du réseau ; s'il échoue, la connexion.
  const renewTried = useRef(false)
  const [renewed, setRenewed] = useState(0)

  useEffect(() => {
    if (!online) {
      renewTried.current = false
      return
    }
    if (expired && !renewTried.current) {
      renewTried.current = true
      void renew().finally(() => setRenewed((count) => count + 1))
      return
    }
    if (mustSignIn) void auth.signinRedirect()
  }, [online, expired, mustSignIn, auth, renew, renewed])

  return auth.isAuthenticated || offlineSession ? (
    children
  ) : (
    <Splash label={t("loading")} />
  )
}
