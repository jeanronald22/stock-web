"use client"

import { CircleHelpIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { NotificationBell } from "@/components/notifications/notification-bell"
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
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-4 md:rounded-t-xl">
      <SidebarTrigger
        aria-label={t("toggleSidebar")}
        {...(isMobile ? tourAnchor(TourAnchors.menuButton) : {})}
      />
      <OrganizationSwitcher />
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        disabled={!tour.available}
        onClick={tour.start}
        {...tourAnchor(TourAnchors.help)}
      >
        <CircleHelpIcon />
        {t("guide")}
      </Button>
      <NotificationBell />
    </header>
  )
}
