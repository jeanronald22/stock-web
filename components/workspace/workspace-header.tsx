"use client"

import { CircleHelpIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { NotificationBell } from "@/components/notifications/notification-bell"
import { ConnectivityStatus } from "@/components/offline/connectivity-status"
import { useCurrentTour } from "@/components/tour/tour-provider"
import { Button } from "@/components/ui/button"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"

import { OrganizationSwitcher } from "./organization-switcher"

export function WorkspaceHeader() {
  const t = useTranslations("workspace")
  const tour = useCurrentTour()
  const { isMobile } = useSidebar()

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1 border-b bg-background/90 px-3 backdrop-blur sm:gap-2 sm:px-4 md:rounded-t-xl">
      <SidebarTrigger
        aria-label={t("toggleSidebar")}
        {...(isMobile ? tourAnchor(TourAnchors.menuButton) : {})}
      />
      <OrganizationSwitcher />
      <div className="flex-1" />
      <ConnectivityStatus />
      <Button
        variant="ghost"
        size="sm"
        disabled={!tour.available}
        onClick={tour.start}
        aria-label={t("guide")}
        className="max-sm:size-8 max-sm:px-0"
        {...tourAnchor(TourAnchors.help)}
      >
        <CircleHelpIcon />
        {/* Téléphone : l'icône seule, l'en-tête est étroit. */}
        <span className="max-sm:hidden">{t("guide")}</span>
      </Button>
      <NotificationBell />
    </header>
  )
}
