"use client"

import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { HomeRedirect } from "@/components/app/home-redirect"
import { Splash } from "@/components/app/splash"
import { TourProvider } from "@/components/tour/tour-provider"
import { useMe } from "@/lib/api/platform-queries"
import { useActiveOrganization } from "@/lib/organization/active-organization"

import { WorkspaceContext, type Workspace } from "./workspace-context"

/**
 * Garantit une entreprise active pour les écrans de travail, avec ou sans barre latérale
 * (les assistants de création s'affichent en plein écran).
 */
export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  const me = useMe()
  const { activeOrganizationId } = useActiveOrganization()

  const workspace = useMemo<Workspace | null>(() => {
    const organization = me.data?.organizations.find(
      (candidate) => candidate.id === activeOrganizationId
    )
    return me.data && organization
      ? {
          user: me.data.user,
          organization,
          organizations: me.data.organizations,
        }
      : null
  }, [me.data, activeOrganizationId])

  if (!me.data && !me.error) return <Splash label={t("common.loading")} />
  // Erreur de chargement, ou entreprise retirée depuis le dernier passage : l'accueil décide.
  if (!workspace) return <HomeRedirect />

  return (
    <WorkspaceContext value={workspace}>
      <TourProvider>{children}</TourProvider>
    </WorkspaceContext>
  )
}
