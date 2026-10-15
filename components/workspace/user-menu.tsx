"use client"

import { BellIcon, ChevronsUpDownIcon, LanguagesIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"

import { SignOutItem } from "@/components/offline/sign-out-item"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
} from "@/components/ui/sidebar"
import { isAppLocale, locales } from "@/i18n/locales"
import { initials } from "@/lib/format"
import { rememberLocale } from "@/lib/locale-preference"
import { Routes } from "@/lib/routes"

import { useWorkspace } from "./workspace-context"

export function UserMenu() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { user } = useWorkspace()
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
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-foreground text-xs font-semibold text-background">
                {initials(fullName || contact)}
              </AvatarFallback>
            </Avatar>
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
            <DropdownMenuItem
              onClick={() => router.push(Routes.notificationSettings)}
            >
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
                    if (!isAppLocale(value)) return
                    rememberLocale(value)
                    router.refresh()
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
