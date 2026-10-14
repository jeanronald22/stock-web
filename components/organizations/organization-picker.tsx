"use client"

import { ChevronRightIcon, PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { Button } from "@/components/ui/button"
import { Splash } from "@/components/app/splash"
import { useMe } from "@/lib/api/platform-queries"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { Routes } from "@/lib/routes"

import { OrganizationAvatar } from "./organization-avatar"
import { ReceivedInvitations } from "./received-invitations"

export function OrganizationPicker() {
  const t = useTranslations()
  const router = useRouter()
  const me = useMe()
  const { setActiveOrganizationId } = useActiveOrganization()

  if (!me.data) return <Splash label={t("common.loading")} />

  const invitedOnly = me.data.organizations.length === 0

  const choose = (id: string) => {
    setActiveOrganizationId(id)
    router.replace(Routes.dashboard)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <KreskalaLogo className="h-8" />
      </header>
      <main className="flex flex-1 justify-center px-4 pt-6 pb-16 sm:pt-16">
        <div className="w-full max-w-lg animate-rise-in">
          {/* Invitée sans entreprise : on lui propose de rejoindre l'équipe, ou de créer la sienne. */}
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {invitedOnly
              ? t("organizations.invitedTitle")
              : t("organizations.title")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {invitedOnly
              ? t("organizations.invitedDescription")
              : t("organizations.description")}
          </p>
          {me.data.invitations.length > 0 && (
            <div className="mt-10">
              <ReceivedInvitations
                invitations={me.data.invitations}
                user={me.data.user}
              />
            </div>
          )}
          <ul className="mt-10 grid gap-3">
            {me.data.organizations.map((organization) => (
              <li key={organization.id}>
                <button
                  type="button"
                  onClick={() => choose(organization.id)}
                  className="group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-[border-color,box-shadow] duration-(--duration-fast) hover:border-foreground/30 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                >
                  <OrganizationAvatar
                    name={organization.name}
                    className="size-12 text-base"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {organization.name}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {organization.city} ·{" "}
                      {t(`organizations.roles.${organization.role}`)}
                    </span>
                  </span>
                  <ChevronRightIcon
                    className="size-5 text-muted-foreground transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
            <li>
              <Button
                size="xl"
                className="w-full"
                onClick={() => router.push(Routes.welcome)}
              >
                <PlusIcon />
                {invitedOnly
                  ? t("organizations.createOwn")
                  : t("organizations.create")}
              </Button>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
