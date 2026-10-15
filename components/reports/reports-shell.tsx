"use client"

import { ArrowLeftRightIcon, ScaleIcon, TriangleAlertIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import { WarehouseFilter } from "@/components/catalog/warehouse-filter"
import { SectionTabs } from "@/components/workspace/section-tabs"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { Routes } from "@/lib/routes"

import { PeriodPicker } from "./period-picker"
import { useReportSearch } from "./use-report-search"

/**
 * Cadre des rapports (D38) : trois onglets qui gardent la période et les dépôts choisis, la barre
 * de filtres, et l'export du rapport ouvert ([actions]).
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
  const { period, warehouseIds, setPeriod, setWarehouses } = useReportSearch()
  const query = params.toString()
  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={[
          { label: t("breadcrumb"), href: Routes.stock },
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
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <PeriodPicker period={period} onChange={setPeriod} />
        <WarehouseFilter value={warehouseIds} onChange={setWarehouses} />
      </div>
      <div className="mt-8">{children}</div>
    </PageBody>
  )
}
