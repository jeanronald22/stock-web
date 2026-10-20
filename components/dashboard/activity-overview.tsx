"use client"

import {
  ArrowDownToLineIcon,
  ArrowRightIcon,
  ArrowUpFromLineIcon,
  ClipboardListIcon,
  PackageXIcon,
  ScaleIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { ActivityChart } from "@/components/reports/activity-chart"
import {
  changeOf,
  StatGrid,
  StatTile,
  StatTone,
  useReportQuantity,
} from "@/components/reports/report-parts"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { InventoryStatus } from "@/lib/api/inventories"
import { useInventories } from "@/lib/api/inventory-queries"
import { useActivitySummary } from "@/lib/api/report-queries"
import type { ActivitySummary } from "@/lib/api/reports"
import { ListQueryParams, RecordRoutes, Routes } from "@/lib/routes"
import { INBOUND_TYPES, OUTBOUND_TYPES, totalOf } from "@/lib/reports/activity"
import {
  PeriodPreset,
  presetPeriod,
  previousPeriod,
} from "@/lib/reports/periods"

/** Périodes proposées sur l'accueil ; les rapports en offrent d'autres. */
const PERIODS = [PeriodPreset.last7Days, PeriodPreset.last30Days] as const
type HomePeriod = (typeof PERIODS)[number]

/** Ce que l'accueil met en avant : l'activité (gérant, manager) ou les contrôles (contrôleur). */
export const OverviewFocus = {
  activity: "activity",
  control: "control",
} as const
export type OverviewFocus = (typeof OverviewFocus)[keyof typeof OverviewFocus]

/**
 * L'activité de ses dépôts sur 7 ou 30 jours (D38) : quatre chiffres comparés à la période
 * précédente, la courbe des bons, les articles les plus sortis et la casse par motif. Chaque
 * chiffre ouvre le rapport correspondant, sur la même période.
 */
export function ActivityOverview({ focus }: { focus: OverviewFocus }) {
  const t = useTranslations("dashboard.activity")
  const [preset, setPreset] = useState<HomePeriod>(PeriodPreset.last7Days)
  const period = useMemo(() => presetPeriod(preset), [preset])
  const previous = useMemo(() => previousPeriod(period), [period])
  const current = useActivitySummary(period)
  const before = useActivitySummary(previous)
  const reportQuery = `${ListQueryParams.from}=${period.from}&${ListQueryParams.to}=${period.to}`

  return (
    <section aria-labelledby="activity-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="activity-title"
          className="text-xl font-semibold tracking-tight"
        >
          {focus === OverviewFocus.activity ? t("title") : t("controlTitle")}
        </h2>
        <div className="flex items-center gap-3">
          <ToggleGroup
            aria-label={t("period")}
            variant="outline"
            spacing={0}
            value={[preset]}
            onValueChange={(values: string[]) => {
              const next = PERIODS.find((candidate) => candidate === values[0])
              if (next) setPreset(next)
            }}
          >
            {PERIODS.map((value) => (
              <ToggleGroupItem key={value} value={value} className="px-3">
                {t(`periods.${value}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Link
            href={`${Routes.reports}?${reportQuery}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            {t("reports")}
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      {!current.data ? (
        <Skeleton className="h-60 rounded-2xl lg:h-32" aria-hidden />
      ) : (
        <>
          {focus === OverviewFocus.activity ? (
            <ActivityTiles
              summary={current.data}
              previous={before.data}
              query={reportQuery}
            />
          ) : (
            <ControlTiles summary={current.data} query={reportQuery} />
          )}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border p-4 sm:p-5">
              <h3 className="font-semibold">{t("chart")}</h3>
              <p className="text-sm text-muted-foreground">{t("chartHint")}</p>
              <ActivityChart
                activity={current.data.activity}
                className="mt-4"
              />
            </div>
            {focus === OverviewFocus.activity ? (
              <TopIssued summary={current.data} />
            ) : (
              <DamageByReason summary={current.data} query={reportQuery} />
            )}
          </div>
          {focus === OverviewFocus.activity &&
            current.data.damageByReason.length > 0 && (
              <DamageByReason summary={current.data} query={reportQuery} />
            )}
        </>
      )}
    </section>
  )
}

function ActivityTiles({
  summary,
  previous,
  query,
}: {
  summary: ActivitySummary
  previous: ActivitySummary | undefined
  query: string
}) {
  const t = useTranslations("dashboard.activity.tiles")
  const inbound = totalOf(summary.totals, INBOUND_TYPES)
  const outbound = totalOf(summary.totals, OUTBOUND_TYPES)
  const change = (now: number, then: number | undefined) =>
    then === undefined ? null : changeOf(now, then)
  return (
    <StatGrid columns={4}>
      <StatTile
        label={t("inbound")}
        value={inbound}
        hint={t("vouchers", { count: inbound })}
        icon={ArrowDownToLineIcon}
        tone={StatTone.good}
        change={change(
          inbound,
          previous && totalOf(previous.totals, INBOUND_TYPES)
        )}
        href={`${Routes.reports}?${query}`}
      />
      <StatTile
        label={t("outbound")}
        value={outbound}
        hint={t("vouchers", { count: outbound })}
        icon={ArrowUpFromLineIcon}
        change={change(
          outbound,
          previous && totalOf(previous.totals, OUTBOUND_TYPES)
        )}
        href={`${Routes.reports}?${query}`}
      />
      <DamageTile summary={summary} query={query} />
      <GapsTile summary={summary} query={query} />
    </StatGrid>
  )
}

/** Contrôleur : ce qu'il doit vérifier d'abord. */
function ControlTiles({
  summary,
  query,
}: {
  summary: ActivitySummary
  query: string
}) {
  const t = useTranslations("dashboard.activity.tiles")
  const open = useInventories(InventoryStatus.open, 0, 1)
  const inventories = open.data?.total ?? 0
  const outbound = totalOf(summary.totals, OUTBOUND_TYPES)
  return (
    <StatGrid columns={4}>
      <GapsTile summary={summary} query={query} />
      <DamageTile summary={summary} query={query} />
      <StatTile
        label={t("inventories")}
        value={inventories}
        hint={t("inventoriesHint")}
        icon={ClipboardListIcon}
        tone={inventories > 0 ? StatTone.warning : StatTone.neutral}
        href={Routes.stock}
      />
      <StatTile
        label={t("outbound")}
        value={outbound}
        hint={t("vouchers", { count: outbound })}
        icon={ArrowUpFromLineIcon}
        href={`${Routes.reports}?${query}`}
      />
    </StatGrid>
  )
}

function DamageTile({
  summary,
  query,
}: {
  summary: ActivitySummary
  query: string
}) {
  const t = useTranslations("dashboard.activity.tiles")
  return (
    <StatTile
      label={t("damage")}
      value={summary.damageVouchers}
      hint={t("vouchers", { count: summary.damageVouchers })}
      icon={PackageXIcon}
      tone={summary.damageVouchers > 0 ? StatTone.bad : StatTone.neutral}
      href={`${Routes.reportsDamage}?${query}`}
    />
  )
}

function GapsTile({
  summary,
  query,
}: {
  summary: ActivitySummary
  query: string
}) {
  const t = useTranslations("dashboard.activity.tiles")
  return (
    <StatTile
      label={t("gaps")}
      value={summary.receiptsWithDiscrepancy}
      hint={t("gapsHint", { count: summary.receiptsWithDiscrepancy })}
      icon={ScaleIcon}
      tone={
        summary.receiptsWithDiscrepancy > 0
          ? StatTone.warning
          : StatTone.neutral
      }
      href={`${Routes.reportsDiscrepancies}?${query}`}
    />
  )
}

/** Les articles les plus sortis de la période, chacun dans son unité. */
function TopIssued({ summary }: { summary: ActivitySummary }) {
  const t = useTranslations("dashboard.activity")
  const quantity = useReportQuantity()
  const top = summary.topIssued
  const max = Math.max(1, ...top.map((row) => row.issued))
  return (
    <div className="rounded-2xl border p-4 sm:p-5">
      <h3 className="font-semibold">{t("topIssued")}</h3>
      {top.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("noIssue")}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {top.map((row) => (
            <li key={row.item.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <Link
                  href={RecordRoutes.item(row.item.id)}
                  className="min-w-0 truncate font-medium hover:underline"
                >
                  {row.item.name}
                </Link>
                <span className="shrink-0 num text-muted-foreground">
                  {quantity(row.item.baseUnit, row.issued)}
                </span>
              </div>
              {/* Longueur relative au plus sorti : les unités diffèrent, l'ordre se lit quand même. */}
              <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-4"
                  style={{ width: `${(row.issued / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function DamageByReason({
  summary,
  query,
}: {
  summary: ActivitySummary
  query: string
}) {
  const t = useTranslations("dashboard.activity")
  const tReasons = useTranslations("vouchers.reasons")
  const rows = summary.damageByReason
  const total = rows.reduce((sum, row) => sum + row.lines, 0)
  return (
    <div className="rounded-2xl border p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{t("damageByReason")}</h3>
        <Link
          href={`${Routes.reportsDamage}?${query}`}
          className="text-sm font-semibold text-primary"
        >
          {t("details")}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("noDamage")}</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {rows.map((row) => (
            <li
              key={row.reason}
              className="rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1 text-sm"
            >
              {tReasons(`${row.reason}.label`)}{" "}
              <span className="num font-semibold">
                {t("share", { share: Math.round((row.lines / total) * 100) })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
