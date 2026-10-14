"use client"

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { OrganizationAvatar } from "@/components/organizations/organization-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { Routes } from "@/lib/routes"

import { useWorkspace } from "./workspace-context"

/**
 * En tête de la barre latérale, à la place du logo (modèle « team switcher » de shadcn) : la marque,
 * l'entreprise active, et le changement d'entreprise au même endroit.
 */
export function OrganizationSwitcher() {
  const t = useTranslations()
  const router = useRouter()
  const { organization: active, organizations } = useWorkspace()
  const { setActiveOrganizationId } = useActiveOrganization()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={active.name}
                className="data-open:bg-sidebar-accent"
              />
            }
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary"
              aria-hidden
            >
              <KreskalaLogo
                variant="symbol"
                tone="on-brand"
                className="size-5"
              />
            </span>
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-semibold">
                {active.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {active.city}
              </span>
            </span>
            <ChevronsUpDownIcon
              className="ml-auto text-muted-foreground"
              aria-hidden
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {t("menu.switchOrganization")}
              </DropdownMenuLabel>
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
            <DropdownMenuItem onClick={() => router.push(Routes.welcome)}>
              <PlusIcon />
              {t("organizations.create")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
