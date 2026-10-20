"use client"

import {
  BellIcon,
  ChevronsUpDownIcon,
  LanguagesIcon,
  UserRoundIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"

import { SignOutItem } from "@/components/offline/sign-out-item"
import { PersonAvatar } from "@/components/profile/person-avatar"
import { useSwitchLocale } from "@/components/profile/use-switch-locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { isAppLocale, locales } from "@/i18n/locales"
import { Routes } from "@/lib/routes"

import { useWorkspace } from "./workspace-context"

export function UserMenu() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { user } = useWorkspace()
  const switchLocale = useSwitchLocale()
  const { setOpenMobile } = useSidebar()
  // Sur téléphone, le menu est dans le panneau latéral : il se ferme avec la navigation.
  const go = (route: string) => {
    setOpenMobile(false)
    router.push(route)
  }
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ")
  const contact = user.email ?? user.phone ?? ""

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("menu.open")}
            render={<SidebarMenuButton size="lg" />}
          >
            <PersonAvatar
              name={fullName || contact}
              photoUrl={user.photoUrl}
              className="size-8"
              fallbackClassName="bg-foreground text-xs text-background"
            />
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-semibold">{fullName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {contact}
              </span>
            </span>
            <ChevronsUpDownIcon
              className="ml-auto text-muted-foreground"
              aria-hidden
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col">
                <span className="truncate font-semibold text-foreground">
                  {fullName}
                </span>
                <span className="truncate text-xs font-normal">{contact}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => go(Routes.profile)}>
              <UserRoundIcon />
              {t("menu.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => go(Routes.notificationSettings)}>
              <BellIcon />
              {t("notifications.settingsTitle")}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <LanguagesIcon />
                {t("languages.label")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={locale}
                  onValueChange={(value: string) => {
                    if (isAppLocale(value) && value !== locale)
                      switchLocale(value)
                  }}
                >
                  {locales.map((option) => (
                    <DropdownMenuRadioItem key={option} value={option}>
                      {t(`languages.${option}`)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <SignOutItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
