"use client"

import { LanguagesIcon, LogOutIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useAuth } from "react-oidc-context"

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
import { isAppLocale, locales } from "@/i18n/locales"
import type { User } from "@/lib/api/platform"
import { initials } from "@/lib/format"
import { rememberLocale } from "@/lib/locale-preference"

export function UserMenu({ user }: { user: User }) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const auth = useAuth()
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("menu.open")}
        render={<button type="button" className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none" />}
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-foreground text-sm font-semibold text-background">
            {initials(fullName || user.email || user.phone || "")}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate font-semibold text-foreground">{fullName}</span>
            <span className="truncate text-xs font-normal">{user.email ?? user.phone}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
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
        <DropdownMenuItem onClick={() => void auth.signoutRedirect()}>
          <LogOutIcon />
          {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
