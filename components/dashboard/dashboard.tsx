"use client"

import {
  ArrowDownToLineIcon,
  ArrowRightIcon,
  BoxesIcon,
  CheckIcon,
  UsersIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useFormatter, useNow, useTranslations } from "next-intl"

import { ShelfScene } from "@/components/illustrations/shelf-scene"
import { usePageTour } from "@/components/tour/tour-provider"
import { PageBody } from "@/components/workspace/page-header"
import { OpenInventories } from "@/components/inventory/open-inventories"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useWorkspace } from "@/components/workspace/workspace-context"
import { StockPermission, StockRole } from "@/lib/api/stock"
import { MembershipRole } from "@/lib/api/platform"
import { useItemCount, useWarehouses } from "@/lib/api/stock-queries"
import { useTeam } from "@/lib/api/team-queries"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import { Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { cn } from "@/lib/utils"

import { ReceivedInvitations } from "@/components/organizations/received-invitations"
import { useMe } from "@/lib/api/platform-queries"

import { ActivityOverview, OverviewFocus } from "./activity-overview"
import { RequestsCard } from "./requests-card"
import { StockAlertsCard } from "./stock-alerts-card"
import { StorekeeperOverview } from "./storekeeper-overview"
import { TransfersToReceiveCard } from "./transfers-to-receive-card"

/** Tous les bons : seul le total sert, pour cocher l'étape « réception ». */
const ALL_VOUCHERS = {}
const TEAM_STEP = "team"

type Step = {
  key: "warehouses" | "products" | "receipt" | "team"
  icon: LucideIcon
  /** Avant : créer le premier ; après : retrouver la liste. */
  createHref: string
  listHref: string
  count: number | undefined
}

export function Dashboard() {
  const t = useTranslations()
  const format = useFormatter()
  const now = useNow()
  const { user, organization } = useWorkspace()
  const warehouses = useWarehouses()
  const itemCount = useItemCount()
  const vouchers = useVouchersPage(ALL_VOUCHERS, 0, 1)
  const me = useMe()
  const invitations = me.data?.invitations ?? []
  // L'équipe se constitue par le propriétaire et les administrateurs (DECISIONS.md, D25).
  const managesTeam = organization.role !== MembershipRole.member
  const team = useTeam({ enabled: managesTeam })
  usePageTour("workspace", {
    ready: warehouses.isSuccess && itemCount.isSuccess,
  })

  // Dépôts d'abord : un article se range dans les dépôts où il est proposé.
  const steps: Step[] = [
    {
      key: "warehouses",
      icon: WarehouseIcon,
      createHref: Routes.newWarehouse,
      listHref: Routes.warehouses,
      count: warehouses.data?.length,
    },
    {
      key: "products",
      icon: BoxesIcon,
      createHref: Routes.newItem,
      listHref: Routes.items,
      count: itemCount.data,
    },
    {
      key: "receipt",
      icon: ArrowDownToLineIcon,
      createHref: Routes.newReceipt,
      listHref: Routes.vouchers,
      count: vouchers.data?.total,
    },
    ...(managesTeam
      ? [
          {
            key: TEAM_STEP,
            icon: UsersIcon,
            createHref: Routes.newInvitation,
            listHref: Routes.team,
            // Fait dès qu'une autre personne est membre ou invitée.
            count: team.data
              ? team.data.members.length - 1 + team.data.invitations.length
              : undefined,
          } satisfies Step,
        ]
      : []),
  ]

  const access = useStockAccess()
  const role = access.access.role
  // Premiers pas : pour qui peut les faire, tant que dépôt, article et réception ne sont pas faits.
  // Inviter l'équipe reste proposé, sans retenir les premiers pas.
  const onboarding =
    (access.can(StockPermission.manageCatalog) || managesTeam) &&
    steps.some((step) => step.key !== TEAM_STEP && step.count === 0)
  const scoped = role !== null && role !== StockRole.generalManager

  return (
    <PageBody>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground first-letter:uppercase">
            {format.dateTime(now, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-1 animate-rise-in text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("dashboard.greeting", { name: user.firstName ?? "" })}
          </h1>
        </div>
        {scoped && warehouses.data && warehouses.data.length > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <WarehouseIcon className="size-4" aria-hidden />
            {t("dashboard.scope", {
              warehouses: warehouses.data
                .map((warehouse) => warehouse.name)
                .join(" · "),
            })}
          </p>
        )}
      </div>

      {invitations.length > 0 && me.data && (
        <div className="mt-6">
          <ReceivedInvitations invitations={invitations} user={me.data.user} />
        </div>
      )}

      {onboarding && (
        <>
          <section
            className="mt-8 overflow-hidden rounded-2xl bg-primary text-primary-foreground"
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
          <ol
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            {...tourAnchor(TourAnchors.nextSteps)}
          >
            {steps.map((step, index) => (
              <StepCard key={step.key} step={step} index={index + 1} />
            ))}
          </ol>
        </>
      )}

      <div className="mt-8 space-y-6">
        {/* Ce qui attend une décision ou un geste passe avant les chiffres. */}
        <RequestsCard />
        <TransfersToReceiveCard />
        {role === StockRole.storekeeper && <StorekeeperOverview />}
        {(role === StockRole.generalManager || role === StockRole.manager) && (
          <ActivityOverview focus={OverviewFocus.activity} />
        )}
        {role === StockRole.controller && (
          <>
            <OpenInventories className="" />
            <ActivityOverview focus={OverviewFocus.control} />
          </>
        )}
        {role !== null && <StockAlertsCard />}
      </div>
    </PageBody>
  )
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const t = useTranslations("dashboard.steps")
  const done = (step.count ?? 0) > 0
  const Icon = step.icon

  return (
    <li>
      <Link
        href={done ? step.listHref : step.createHref}
        className={cn(
          "group flex h-full flex-col gap-4 rounded-2xl border p-5 transition-colors hover:border-foreground/20 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
          done && "border-primary/30 bg-primary/5"
        )}
      >
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              done ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
            aria-hidden
          >
            {done ? (
              <CheckIcon className="size-5" />
            ) : (
              <Icon className="size-5" />
            )}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            0{index}
          </span>
        </div>
        <div>
          <h3 className="font-semibold">{t(`${step.key}.title`)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`${step.key}.description`)}
          </p>
        </div>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {done
            ? t(`${step.key}.done`, { count: step.count ?? 0 })
            : t(`${step.key}.action`)}
          <ArrowRightIcon
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </Link>
    </li>
  )
}
