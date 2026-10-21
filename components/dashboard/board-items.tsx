"use client"

import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  HourglassIcon,
  LayersIcon,
} from "lucide-react"
import { useFormatter, useNow, useTranslations } from "next-intl"

import { ItemLink } from "@/components/items/item-link"
import { ItemHistoryArea } from "@/components/items/item-movements-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useItemHistory } from "@/lib/api/report-queries"
import type { ActivityAnalysis, ItemCoverage } from "@/lib/api/reports"
import { useItem } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { cn } from "@/lib/utils"

import {
  BoardCard,
  RankedRow,
  ReportEmpty,
  ReportSection,
  StatGrid,
  StatTile,
  StatTone,
  useReportQuantity,
} from "@/components/reports/report-parts"
import { useReportSearch } from "@/components/reports/use-report-search"

/** En deçà, un article qui va manquer passe au rouge : il faut commander tout de suite. */
const URGENT_DAYS = 7
/** Au-delà, il ne presse pas (comme l'API, AnalysisService.COVERAGE_HORIZON_DAYS). */
const COVERAGE_HORIZON_DAYS = 30

/** Rythme quotidien en dessous duquel le dixième compte. */
const PRECISE_PACE_BELOW = 10

const coverageTone = (days: number) =>
  days < URGENT_DAYS ? StatTone.bad : StatTone.warning

/**
 * Un petit rythme se lit au dixième (« 1,7 pièce par jour ») ; au-delà de 10, le dixième n'apporte
 * rien (« 48 pièces par jour » plutôt que « 47,6 »).
 */
const perDay = (value: number) =>
  value < PRECISE_PACE_BELOW ? Math.round(value * 10) / 10 : Math.round(value)

/** Les articles les plus sortis de la période, en nombre de sorties ; la quantité dans son unité. */
export function TopIssued({ analysis }: { analysis: ActivityAnalysis }) {
  const t = useTranslations("analysis.items")
  const quantity = useReportQuantity()
  const rows = analysis.topIssued
  const max = Math.max(1, ...rows.map((row) => row.vouchers))
  return (
    <BoardCard title={t("topIssued")} description={t("topIssuedHint")}>
      {rows.length === 0 ? (
        <ReportEmpty>{t("noIssue")}</ReportEmpty>
      ) : (
        <ol className="space-y-3">
          {rows.map((row) => (
            <RankedRow
              key={row.item.id}
              label={<ItemName id={row.item.id} name={row.item.name} />}
              value={t("issues", { count: row.vouchers })}
              detail={quantity(row.item.baseUnit, row.issued)}
              share={row.vouchers / max}
            />
          ))}
        </ol>
      )}
    </BoardCard>
  )
}

/** Ce que le stock d'aujourd'hui tient au rythme des sorties de la période, les plus pressés d'abord. */
export function RunningOut({ rows }: { rows: ItemCoverage[] }) {
  const t = useTranslations("analysis.items")
  const quantity = useReportQuantity()
  return (
    <BoardCard title={t("runningOut")} description={t("runningOutHint")}>
      {rows.length === 0 ? (
        <ReportEmpty>{t("noRunningOut")}</ReportEmpty>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li
              key={row.item.id}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <ItemName id={row.item.id} name={row.item.name} />
                <p className="text-xs text-muted-foreground">
                  {t("pace", {
                    daily: quantity(row.item.baseUnit, perDay(row.dailyIssued)),
                    stock: quantity(row.item.baseUnit, row.stock),
                  })}
                </p>
              </div>
              <CoverageBadge days={row.days} />
            </li>
          ))}
        </ul>
      )}
    </BoardCard>
  )
}

function CoverageBadge({ days }: { days: number }) {
  const t = useTranslations("analysis.items")
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 num text-xs font-semibold",
        coverageTone(days) === StatTone.bad
          ? "bg-destructive/10 text-destructive"
          : "bg-warning-muted text-warning-muted-foreground"
      )}
    >
      {t("days", { days })}
    </span>
  )
}

/** En stock, sans sortie sur la période : ce qui immobilise de la place et de l'argent. */
export function Dormant({ analysis }: { analysis: ActivityAnalysis }) {
  const t = useTranslations("analysis.items")
  const format = useFormatter()
  const now = useNow()
  const quantity = useReportQuantity()
  const rows = analysis.dormant
  const hidden = analysis.stock.dormant - rows.length
  return (
    <BoardCard title={t("dormant")} description={t("dormantHint")}>
      {rows.length === 0 ? (
        <ReportEmpty>{t("noDormant")}</ReportEmpty>
      ) : (
        <>
          <ul className="divide-y">
            {rows.map((row) => (
              <li
                key={row.item.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <ItemName id={row.item.id} name={row.item.name} />
                  <p className="truncate text-xs text-muted-foreground">
                    {row.lastIssuedAt
                      ? t("lastIssued", {
                          when: format.relativeTime(
                            new Date(row.lastIssuedAt),
                            now
                          ),
                        })
                      : t("neverIssued")}
                  </p>
                </div>
                <span className="shrink-0 num text-sm text-muted-foreground">
                  {quantity(row.item.baseUnit, row.stock)}
                </span>
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("moreDormant", { count: hidden })}
            </p>
          )}
        </>
      )}
    </BoardCard>
  )
}

function ItemName({ id, name }: { id: string; name: string }) {
  return (
    <ItemLink
      itemId={id}
      className="block min-w-0 truncate text-sm font-medium hover:underline"
    >
      {name}
    </ItemLink>
  )
}

/**
 * Un article choisi : ses quantités sur la période (dans son unité, elles s'additionnent), ce que
 * son stock tient au rythme des sorties, et sa courbe.
 */
export function ItemFocus({
  itemId,
  analysis,
}: {
  itemId: string
  analysis: ActivityAnalysis
}) {
  const t = useTranslations("analysis.item")
  const tItems = useTranslations("analysis.items")
  const errorMessage = useErrorMessage()
  const quantity = useReportQuantity()
  const { search } = useReportSearch()
  const item = useItem(itemId)
  const history = useItemHistory(itemId, search)
  const days = history.data?.days ?? []

  if (!item.data || history.isPending)
    return <Skeleton className="h-96 rounded-2xl" aria-hidden />
  const unit = item.data.baseUnit
  const inbound = days.reduce((sum, day) => sum + day.inbound, 0)
  const outbound = days.reduce((sum, day) => sum + day.outbound, 0)
  const stock = days.at(-1)?.balance ?? 0
  // Le rythme des seules sorties (pas des transferts ni de la casse), comme « Bientôt en rupture ».
  const issued = analysis.topIssued[0]?.issued ?? 0
  const daily = days.length > 0 ? issued / days.length : 0
  const coverage = daily > 0 ? Math.floor(Math.max(0, stock) / daily) : null

  return (
    <ReportSection
      title={item.data.name}
      description={t("description", { reference: item.data.reference })}
      actions={
        <ItemLink
          itemId={itemId}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {t("open")}
        </ItemLink>
      }
    >
      <StatGrid columns={4}>
        <StatTile
          label={t("stock")}
          value={quantity(unit, stock)}
          hint={t("stockHint")}
          icon={LayersIcon}
        />
        <StatTile
          label={t("inbound")}
          value={quantity(unit, inbound)}
          hint={t("inboundHint")}
          icon={ArrowDownToLineIcon}
          tone={StatTone.good}
        />
        <StatTile
          label={t("outbound")}
          value={quantity(unit, outbound)}
          hint={t("outboundHint")}
          icon={ArrowUpFromLineIcon}
        />
        <StatTile
          label={t("coverage")}
          value={coverage === null ? "—" : tItems("days", { days: coverage })}
          hint={
            coverage === null
              ? t("noIssue")
              : t("coverageHint", { daily: quantity(unit, perDay(daily)) })
          }
          icon={HourglassIcon}
          tone={
            coverage === null || coverage >= COVERAGE_HORIZON_DAYS
              ? StatTone.neutral
              : coverageTone(coverage)
          }
        />
      </StatGrid>
      <BoardCard title={t("chart")} description={t("chartHint")}>
        {history.isError ? (
          <p role="alert" className="text-sm text-muted-foreground">
            {errorMessage(history.error)}
          </p>
        ) : (
          <ItemHistoryArea days={days} baseUnit={unit} />
        )}
      </BoardCard>
    </ReportSection>
  )
}
