"use client"

import { QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { WifiOffIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { AuthProvider, useAuth } from "react-oidc-context"

import { FullPageMessage } from "@/components/app/full-page-message"
import { Splash } from "@/components/app/splash"
import { ApiProvider } from "@/lib/api/api-provider"
import { ApiError } from "@/lib/api/problem"
import { createQueryClient } from "@/lib/api/query-client"
import { oidcSettings } from "@/lib/auth/oidc-settings"
import { ActiveOrganizationProvider } from "@/lib/organization/active-organization"

import { RuntimeConfigProvider, useRuntimeConfig } from "./runtime-config-provider"

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
  const settings = useMemo(() => oidcSettings(config, window.location.origin, locale), [config, locale])
  return <AuthProvider {...settings}>{children}</AuthProvider>
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
      if (error instanceof ApiError && error.isUnauthorized) void auth.signinRedirect()
    }
    const stopQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") onError(event.action.error)
    })
    const stopMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") onError(event.action.error)
    })
    return () => {
      stopQueries()
      stopMutations()
    }
  }, [queryClient, auth])

  return null
}
