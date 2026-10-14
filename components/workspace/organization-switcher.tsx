"use client"

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { OrganizationAvatar } from "@/components/organizations/organization-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { Routes } from "@/lib/routes"

import { useWorkspace } from "./workspace-context"

/**
 * Entreprise active, dans la barre du haut à côté du bouton du menu : son nom toujours visible,
 * le changement d'entreprise et la création d'une nouvelle au même endroit.
 */
export function OrganizationSwitcher() {
  const t = useTranslations()
  const router = useRouter()
  const { organization: active, organizations } = useWorkspace()
  const { setActiveOrganizationId } = useActiveOrganization()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-10 max-w-64 min-w-0 gap-2 px-2"
            aria-label={t("menu.switchOrganization")}
          />
        }
      >
        <OrganizationAvatar name={active.name} className="size-7 text-xs" />
        <span className="grid min-w-0 text-left leading-tight">
          <span className="truncate text-sm font-semibold">{active.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {active.city}
          </span>
        </span>
        <ChevronsUpDownIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("menu.switchOrganization")}</DropdownMenuLabel>
          {organizations.map((organization) => (
            <DropdownMenuItem
              key={organization.id}
              onClick={() => setActiveOrganizationId(organization.id)}
            >
              <OrganizationAvatar
                name={organization.name}
                className="size-7 text-xs"
              />
              <span className="min-w-0 flex-1 truncate">
                {organization.name}
              </span>
              {organization.id === active.id && (
                <CheckIcon
                  className="size-4 text-primary"
                  aria-label={t("menu.currentOrganization")}
                />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="p-1.5">
          <Button
            className="w-full"
            onClick={() => router.push(Routes.welcome)}
          >
            <PlusIcon />
            {t("organizations.create")}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
