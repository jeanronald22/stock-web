"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { MembershipRole } from "@/lib/api/platform"
import { Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"

import { isActiveEntry, workspaceNavigation } from "./navigation"
import { UserMenu } from "./user-menu"
import { useWorkspace } from "./workspace-context"

export function AppSidebar() {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const { organization } = useWorkspace()
  const managesTeam = organization.role !== MembershipRole.member
  const entries = workspaceNavigation.filter(
    (entry) => !entry.teamManagersOnly || managesTeam
  )

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <Link
          href={Routes.dashboard}
          aria-label="Kreskala"
          onClick={() => setOpenMobile(false)}
          className="flex h-10 items-center px-2 group-data-[collapsible=icon]:px-0"
        >
          <KreskalaLogo className="h-7 group-data-[collapsible=icon]:hidden" />
          <KreskalaLogo
            variant="symbol"
            className="hidden size-8 group-data-[collapsible=icon]:block"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup {...tourAnchor(TourAnchors.navigation)}>
          <SidebarGroupContent>
            <SidebarMenu>
              {entries.map((entry) => (
                <SidebarMenuItem key={entry.href}>
                  <SidebarMenuButton
                    isActive={isActiveEntry(entry, pathname)}
                    tooltip={t(entry.label)}
                    // L'écran courant se repère d'un coup d'œil : couleur de la marque ; bandeau plein en mode sombre.
                    className="data-active:bg-primary/10 data-active:font-semibold data-active:text-primary data-active:hover:bg-primary/15 data-active:hover:text-primary dark:data-active:bg-primary dark:data-active:text-primary-foreground dark:data-active:hover:bg-primary/90 dark:data-active:hover:text-primary-foreground"
                    render={
                      <Link
                        href={entry.href}
                        onClick={() => setOpenMobile(false)}
                      />
                    }
                  >
                    <entry.icon />
                    <span>{t(entry.label)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
