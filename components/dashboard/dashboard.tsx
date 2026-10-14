"use client"

import {
  BoxesIcon,
  UsersIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useFormatter, useNow, useTranslations } from "next-intl"

import { HomeRedirect } from "@/components/app/home-redirect"
import { Splash } from "@/components/app/splash"
import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { ShelfScene } from "@/components/illustrations/shelf-scene"
import { AnchoredElements } from "@/components/motion/transitions"
import { Badge } from "@/components/ui/badge"
import { useMe } from "@/lib/api/platform-queries"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { Routes } from "@/lib/routes"

import { OrganizationSwitcher } from "./organization-switcher"
import { UserMenu } from "./user-menu"

type NextStep = { key: "products" | "warehouses" | "team"; icon: LucideIcon }

const NEXT_STEPS: NextStep[] = [
  { key: "products", icon: BoxesIcon },
  { key: "warehouses", icon: WarehouseIcon },
  { key: "team", icon: UsersIcon },
]

export function Dashboard() {
  const t = useTranslations()
  const format = useFormatter()
  const now = useNow()
  const me = useMe()
  const { activeOrganizationId } = useActiveOrganization()

  if (!me.data) return <Splash label={t("common.loading")} />
  const active = me.data.organizations.find(
    (organization) => organization.id === activeOrganizationId
  )
  // Entreprise retirée ou suspendue depuis le dernier passage : on refait le choix.
  if (!active) return <HomeRedirect />

  return (
    <div className="min-h-dvh bg-background">
      <header
        style={{ viewTransitionName: AnchoredElements.header }}
        className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Link
              href={Routes.dashboard}
              className="shrink-0 rounded-md focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              <KreskalaLogo variant="symbol" className="size-9 sm:hidden" />
              <KreskalaLogo className="hidden h-8 sm:block" />
            </Link>
            <span className="h-6 w-px bg-border" aria-hidden />
            <OrganizationSwitcher
              organizations={me.data.organizations}
              active={active}
            />
          </div>
          <UserMenu user={me.data.user} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-8 sm:pt-12">
        <p className="text-sm font-medium text-muted-foreground first-letter:uppercase">
          {format.dateTime(now, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="mt-1 animate-rise-in text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("dashboard.greeting", { name: me.data.user.firstName ?? "" })}
        </h1>

        <section
          className="mt-10 overflow-hidden rounded-2xl bg-primary text-primary-foreground"
          aria-labelledby="ready-title"
        >
          <div className="relative grid items-center gap-6 [background-image:linear-gradient(rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:48px_48px] px-6 py-8 sm:grid-cols-[minmax(0,1fr)_16rem] sm:px-10 sm:py-10">
            <div>
              <h2
                id="ready-title"
                className="text-2xl font-semibold tracking-tight"
              >
                {t("dashboard.readyTitle")}
              </h2>
              <p className="mt-2 max-w-xl text-primary-foreground/80">
                {t("dashboard.readyDescription")}
              </p>
            </div>
            <ShelfScene className="ill-on-brand hidden max-w-64 sm:block" />
          </div>
        </section>

        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {NEXT_STEPS.map(({ key, icon: Icon }) => (
            <li
              key={key}
              className="flex flex-col gap-4 rounded-2xl border p-5"
            >
              <div className="flex items-start justify-between">
                <span
                  className="flex size-11 items-center justify-center rounded-lg bg-muted"
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <Badge variant="info">{t("common.soon")}</Badge>
              </div>
              <div>
                <h3 className="font-semibold">
                  {t(`dashboard.steps.${key}.title`)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`dashboard.steps.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
