"use client"

import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { HomeRedirect } from "@/components/app/home-redirect"
import { Splash } from "@/components/app/splash"
import { TourProvider } from "@/components/tour/tour-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useMe } from "@/lib/api/platform-queries"
import { useActiveOrganization } from "@/lib/organization/active-organization"

import { AppSidebar } from "./app-sidebar"
import { WorkspaceContext, type Workspace } from "./workspace-context"
import { WorkspaceHeader } from "./workspace-header"

/** Cadre des écrans de travail : barre latérale, en-tête, entreprise active. */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
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
      <TourProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <WorkspaceHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TourProvider>
    </WorkspaceContext>
  )
}
