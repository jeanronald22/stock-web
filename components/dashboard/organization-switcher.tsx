"use client"

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

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
import type { Organization } from "@/lib/api/platform"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { Routes } from "@/lib/routes"

export function OrganizationSwitcher({ organizations, active }: { organizations: Organization[]; active: Organization }) {
  const t = useTranslations()
  const router = useRouter()
  const { setActiveOrganizationId } = useActiveOrganization()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          />
        }
      >
        <OrganizationAvatar name={active.name} className="size-8 text-xs" />
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-48 truncate text-sm font-semibold">{active.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{active.city}</span>
        </span>
        <ChevronsUpDownIcon className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("menu.switchOrganization")}</DropdownMenuLabel>
          {organizations.map((organization) => (
            <DropdownMenuItem key={organization.id} onClick={() => setActiveOrganizationId(organization.id)}>
              <OrganizationAvatar name={organization.name} className="size-7 text-xs" />
              <span className="min-w-0 flex-1 truncate">{organization.name}</span>
              {organization.id === active.id && <CheckIcon className="size-4 text-primary" aria-label={t("menu.currentOrganization")} />}
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
  )
}
