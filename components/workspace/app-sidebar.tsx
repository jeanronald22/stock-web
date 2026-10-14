"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import { KreskalaLogo } from "@/components/brand/kreskala-logo"
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
import { Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"

import { isActiveEntry, workspaceNavigation } from "./navigation"
import { OrganizationSwitcher } from "./organization-switcher"
import { UserMenu } from "./user-menu"

export function AppSidebar() {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3">
        <Link
          href={Routes.dashboard}
          aria-label="Kreskala"
          className="flex h-10 items-center px-2 group-data-[collapsible=icon]:px-0"
        >
          <KreskalaLogo className="h-7 group-data-[collapsible=icon]:hidden" />
          <KreskalaLogo
            variant="symbol"
            className="hidden size-8 group-data-[collapsible=icon]:block"
          />
        </Link>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup {...tourAnchor(TourAnchors.navigation)}>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceNavigation.map((entry) => (
                <SidebarMenuItem key={entry.href}>
                  <SidebarMenuButton
                    isActive={isActiveEntry(entry, pathname)}
                    tooltip={t(entry.label)}
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
