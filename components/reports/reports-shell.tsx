"use client"

import { ArrowLeftRightIcon, ScaleIcon, TriangleAlertIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import { DateRangePicker } from "@/components/catalog/date-range-picker"
import { FILTER_CONTROL } from "@/components/catalog/filter-bar"
import { ItemFilter } from "@/components/catalog/item-filter"
import { WarehouseFilter } from "@/components/catalog/warehouse-filter"
import { SectionTabs } from "@/components/workspace/section-tabs"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import type { Period } from "@/lib/reports/periods"
import { Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { useReportSearch } from "./use-report-search"

/**
 * Cadre des rapports (D38), le détail du tableau de bord (D43) : trois onglets qui gardent la
 * période, les dépôts et l'article choisis ; la barre de filtres ; l'export du rapport ouvert
 * ([actions]).
 */
export function ReportsShell({
  actions,
  children,
}: {
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const t = useTranslations("reports")
  const params = useSearchParams()
  const { period, warehouseIds, itemId, setPeriod, setWarehouses, setItem } =
    useReportSearch()
  const query = params.toString()
  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={[
          { label: t("breadcrumb"), href: Routes.dashboard },
          { label: t("title") },
        ]}
        actions={actions}
      />
      <SectionTabs
        label={t("tabs.label")}
        tabs={[
          {
            href: Routes.reports,
            icon: ArrowLeftRightIcon,
            label: t("tabs.movements"),
            except: [Routes.reportsDamage, Routes.reportsDiscrepancies],
            query,
          },
          {
            href: Routes.reportsDamage,
            icon: TriangleAlertIcon,
            label: t("tabs.damage"),
            query,
          },
          {
            href: Routes.reportsDiscrepancies,
            icon: ScaleIcon,
            label: t("tabs.discrepancies"),
            query,
          },
        ]}
      />
      <ReportFilters
        period={period}
        warehouseIds={warehouseIds}
        itemId={itemId}
        onPeriod={setPeriod}
        onWarehouses={setWarehouses}
        onItem={setItem}
        className="mt-6"
      />
      <div className="mt-8">{children}</div>
    </PageBody>
  )
}

/** Période, dépôts et article : la même barre pour le tableau de bord et les rapports. */
export function ReportFilters({
  period,
  warehouseIds,
  itemId,
  onPeriod,
  onWarehouses,
  onItem,
  className,
}: {
  period: Period
  warehouseIds: string[]
  itemId: string | undefined
  onPeriod: (period: Period) => void
  onWarehouses: (warehouseIds: string[]) => void
  onItem: (itemId: string | undefined) => void
  className?: string
}) {
  const t = useTranslations("reports")
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      <WarehouseFilter
        value={warehouseIds}
        onChange={onWarehouses}
        className="sm:w-56"
      />
      <ItemFilter value={itemId} onChange={onItem} className="sm:w-64" />
      <DateRangePicker
        from={period.from}
        to={period.to}
        onChange={(from, to) => from && to && onPeriod({ from, to })}
        label={t("period.label")}
        className={cn(FILTER_CONTROL, "h-11 sm:w-64")}
      />
    </div>
  )
}
