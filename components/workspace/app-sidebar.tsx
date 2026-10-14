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
      <SidebarHeader>
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
                    // L'écran courant se repère d'un coup d'œil : couleur de la marque, texte appuyé.
                    className="data-active:bg-primary/10 data-active:font-semibold data-active:text-primary data-active:hover:bg-primary/15 data-active:hover:text-primary"
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
