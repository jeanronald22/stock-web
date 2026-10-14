"use client"

import { QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { WifiOffIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { UserManager } from "oidc-client-ts"
import { useEffect, useMemo, useState } from "react"
import { AuthProvider, useAuth } from "react-oidc-context"

import { FullPageMessage } from "@/components/app/full-page-message"
import { Splash } from "@/components/app/splash"
import { ApiProvider } from "@/lib/api/api-provider"
import { ApiError, ProblemCode } from "@/lib/api/problem"
import { createQueryClient } from "@/lib/api/query-client"
import { startCrossTabRenewal } from "@/lib/auth/cross-tab-renewal"
import {
  clearSigninParams,
  userManagerSettings,
} from "@/lib/auth/oidc-settings"
import {
  ActiveOrganizationProvider,
  useActiveOrganization,
} from "@/lib/organization/active-organization"

import {
  RuntimeConfigProvider,
  useRuntimeConfig,
} from "./runtime-config-provider"

/** Fournisseurs de l'espace connecté, du plus général au plus spécifique. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  return (
    <RuntimeConfigProvider
      loading={<Splash label={t("common.loading")} />}
      failed={(retry) => (
        <FullPageMessage
          icon={WifiOffIcon}
          title={t("configError.title")}
          description={t("configError.description")}
          action={{ label: t("common.retry"), onClick: retry }}
        />
      )}
    >
      <OidcProvider>
        <QueryProvider>
          <ActiveOrganizationProvider>
            <OrganizationAccessWatcher />
            <ApiProvider>{children}</ApiProvider>
          </ActiveOrganizationProvider>
        </QueryProvider>
      </OidcProvider>
    </RuntimeConfigProvider>
  )
}

function OidcProvider({ children }: { children: React.ReactNode }) {
  const config = useRuntimeConfig()
  const locale = useLocale()
  const userManager = useMemo(
    () =>
      new UserManager(
        userManagerSettings(config, window.location.origin, locale)
      ),
    [config, locale]
  )
  useEffect(() => startCrossTabRenewal(userManager), [userManager])

  return (
    <AuthProvider
      userManager={userManager}
      onSigninCallback={clearSigninParams}
    >
      {children}
    </AuthProvider>
  )
}

function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)
  return (
    <QueryClientProvider client={client}>
      <SessionExpiryWatcher />
      {children}
    </QueryClientProvider>
  )
}

/** Une réponse 401 de l'API (session expirée, renouvellement impossible) renvoie vers la connexion. */
function SessionExpiryWatcher() {
  const queryClient = useQueryClient()
  const auth = useAuth()

  useEffect(() => {
    const onError = (error: unknown) => {
      if (error instanceof ApiError && error.isUnauthorized)
        void auth.signinRedirect()
    }
    const stopQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error")
        onError(event.action.error)
    })
    const stopMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error")
        onError(event.action.error)
    })
    return () => {
      stopQueries()
      stopMutations()
    }
  }, [queryClient, auth])

  return null
}

/**
 * L'entreprise active n'est plus accessible (membre retiré, entreprise suspendue) : on l'oublie,
 * et l'écran d'accueil propose de nouveau le choix.
 */
function OrganizationAccessWatcher() {
  const queryClient = useQueryClient()
  const { setActiveOrganizationId } = useActiveOrganization()

  useEffect(() => {
    const onError = (error: unknown) => {
      if (
        error instanceof ApiError &&
        error.code === ProblemCode.organizationAccessDenied
      )
        setActiveOrganizationId(null)
    }
    const stopQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error")
        onError(event.action.error)
    })
    const stopMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error")
        onError(event.action.error)
    })
    return () => {
      stopQueries()
      stopMutations()
    }
  }, [queryClient, setActiveOrganizationId])

  return null
}
