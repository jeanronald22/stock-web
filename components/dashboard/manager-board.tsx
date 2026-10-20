"use client"

import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  PackageXIcon,
  ScaleIcon,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import { ActivityChart } from "@/components/reports/activity-chart"
import {
  BoardCard,
  changeOf,
  StatGrid,
  StatTile,
  StatTone,
} from "@/components/reports/report-parts"
import { ReportFilters } from "@/components/reports/reports-shell"
import { useReportSearch } from "@/components/reports/use-report-search"
import { Skeleton } from "@/components/ui/skeleton"
import { useActivityAnalysis } from "@/lib/api/report-queries"
import type { ActivityAnalysis } from "@/lib/api/reports"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { VoucherType } from "@/lib/api/vouchers"
import {
  activityStep,
  INBOUND_TYPES,
  OUTBOUND_TYPES,
  totalOf,
} from "@/lib/reports/activity"
import { ListQueryParams, Routes } from "@/lib/routes"

import { AlertSettingsSheet, useCanSetAlerts } from "./alert-settings-sheet"
import { BoardAlerts } from "./board-alerts"
import {
  ReceiptConformityCard,
  StockStateCard,
  VoucherTypesCard,
} from "./board-charts"
import { BoardDomain, BoardDomainChips, useBoardDomains } from "./board-domains"
import { BoardMasonry } from "./board-masonry"
import { Dormant, ItemFocus, RunningOut, TopIssued } from "./board-items"
import {
  CustomersCard,
  DamageCard,
  SuppliersCard,
  TeamCard,
  WarehousesCard,
} from "./board-parties"

/**
 * Tableau de bord du gérant, du manager et du contrôleur (D43) : ce qui attend une décision, puis
 * l'activité de la période, l'état du stock, les sorties, la qualité et l'équipe, filtrés par
 * dépôt, article et période. Chaque carte ouvre le rapport ou la liste qui en donne le détail.
 */
export function ManagerBoard() {
  const errorMessage = useErrorMessage()
  const report = useReportSearch()
  const domains = useBoardDomains()
  const params = useSearchParams()
  const analysis = useActivityAnalysis(report.search)
  const setsAlerts = useCanSetAlerts()

  // Les rapports et le stock reprennent les filtres du tableau ; la période y est toujours écrite.
  const reportParams = new URLSearchParams(params)
  reportParams.delete(ListQueryParams.domain)
  reportParams.set(ListQueryParams.from, report.period.from)
  reportParams.set(ListQueryParams.to, report.period.to)
  const reportQuery = reportParams.toString()
  const warehouseQuery = report.warehouseIds
    .map((id) => `${ListQueryParams.warehouse}=${encodeURIComponent(id)}`)
    .join("&")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <BoardAlerts analysis={analysis.data} reportQuery={reportQuery} />
        </div>
        {setsAlerts && <AlertSettingsSheet />}
      </div>

      <div className="space-y-3">
        <BoardDomainChips domains={domains} />
        <ReportFilters
          period={report.period}
          warehouseIds={report.warehouseIds}
          itemId={report.itemId}
          onPeriod={report.setPeriod}
          onWarehouses={report.setWarehouses}
          onItem={report.setItem}
        />
      </div>

      {analysis.isError ? (
        // Une période de plus d'un an est refusée par l'API : son message le dit.
        <p
          role="alert"
          className="rounded-2xl bg-muted/40 px-6 py-10 text-center text-sm text-muted-foreground"
        >
          {errorMessage(analysis.error)}
        </p>
      ) : !analysis.data ? (
        <div className="grid gap-4 lg:grid-cols-3" aria-hidden>
          <Skeleton className="h-32 rounded-2xl lg:col-span-3" />
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <Board
          analysis={analysis.data}
          itemId={report.itemId}
          shows={domains.shows}
          reportQuery={reportQuery}
          warehouseQuery={warehouseQuery}
        />
      )}
    </div>
  )
}

function Board({
  analysis,
  itemId,
  shows,
  reportQuery,
  warehouseQuery,
}: {
  analysis: ActivityAnalysis
  itemId: string | undefined
  shows: (domain: BoardDomain) => boolean
  reportQuery: string
  warehouseQuery: string
}) {
  const t = useTranslations("analysis")
  // Un article choisi : sa fiche en tête, avec sa courbe en quantités, qui remplace celle des bons ;
  // les classements d'articles n'ont plus d'objet.
  const ranksItems = itemId === undefined
  const activity = shows(BoardDomain.activity)
  const stock = shows(BoardDomain.stock)
  const issues = shows(BoardDomain.issues)
  const quality = shows(BoardDomain.quality)
  return (
    <div className="space-y-4">
      {itemId && (
        <div className="pb-2">
          <ItemFocus itemId={itemId} analysis={analysis} />
        </div>
      )}
      {activity && <ActivityTiles analysis={analysis} query={reportQuery} />}
      {activity && ranksItems && (
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          <BoardCard
            title={t("chart.title")}
            description={t(`chart.${activityStep(analysis.activity.length)}`)}
            link={{
              href: `${Routes.reports}?${reportQuery}`,
              label: t("chart.details"),
            }}
            className="lg:col-span-2"
          >
            <ActivityChart activity={analysis.activity} />
          </BoardCard>
          <VoucherTypesCard analysis={analysis} query={reportQuery} />
        </div>
      )}
      {stock && <WarehousesCard warehouses={analysis.warehouses} />}
      <BoardMasonry>
        {activity && !ranksItems && (
          <VoucherTypesCard analysis={analysis} query={reportQuery} />
        )}
        {stock && (
          <StockStateCard
            stock={analysis.stock}
            warehouseQuery={warehouseQuery}
          />
        )}
        {stock && ranksItems && <RunningOut rows={analysis.runningOut} />}
        {stock && ranksItems && <Dormant analysis={analysis} />}
        {issues && ranksItems && <TopIssued analysis={analysis} />}
        {issues && <CustomersCard analysis={analysis} />}
        {quality && <DamageCard analysis={analysis} query={reportQuery} />}
        {quality && (
          <ReceiptConformityCard analysis={analysis} query={reportQuery} />
        )}
        {quality && <SuppliersCard analysis={analysis} query={reportQuery} />}
        {shows(BoardDomain.team) && <TeamCard analysis={analysis} />}
      </BoardMasonry>
    </div>
  )
}

/** Quatre chiffres de la période, comparés à la période d'avant : on compte des bons (D38). */
function ActivityTiles({
  analysis,
  query,
}: {
  analysis: ActivityAnalysis
  query: string
}) {
  const t = useTranslations("analysis.tiles")
  const { totals, previousTotals } = analysis
  const inbound = totalOf(totals, INBOUND_TYPES)
  const outbound = totalOf(totals, OUTBOUND_TYPES)
  const damage = totals[VoucherType.damage] ?? 0
  const gaps = analysis.receiptsWithDiscrepancy
  return (
    <StatGrid columns={4}>
      <StatTile
        label={t("inbound")}
        value={inbound}
        hint={t("vouchers", { count: inbound })}
        icon={ArrowDownToLineIcon}
        tone={StatTone.good}
        change={changeOf(inbound, totalOf(previousTotals, INBOUND_TYPES))}
        href={`${Routes.reports}?${query}`}
      />
      <StatTile
        label={t("outbound")}
        value={outbound}
        hint={t("vouchers", { count: outbound })}
        icon={ArrowUpFromLineIcon}
        change={changeOf(outbound, totalOf(previousTotals, OUTBOUND_TYPES))}
        href={`${Routes.reports}?${query}`}
      />
      <StatTile
        label={t("damage")}
        value={damage}
        hint={t("vouchers", { count: damage })}
        icon={PackageXIcon}
        tone={damage > 0 ? StatTone.bad : StatTone.neutral}
        change={changeOf(damage, previousTotals[VoucherType.damage] ?? 0)}
        href={`${Routes.reportsDamage}?${query}`}
      />
      <StatTile
        label={t("gaps")}
        value={gaps}
        hint={t("gapsHint", { count: gaps })}
        icon={ScaleIcon}
        tone={gaps > 0 ? StatTone.warning : StatTone.neutral}
        change={changeOf(gaps, analysis.previousReceiptsWithDiscrepancy)}
        href={`${Routes.reportsDiscrepancies}?${query}`}
      />
    </StatGrid>
  )
}
