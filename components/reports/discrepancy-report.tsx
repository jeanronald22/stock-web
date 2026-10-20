"use client"

import { ClipboardCheckIcon, ScaleIcon, TruckIcon } from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"

import { ItemLink } from "@/components/items/item-link"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDiscrepancyReport } from "@/lib/api/report-queries"
import type { DiscrepancyReport } from "@/lib/api/reports"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { ReportSkeleton } from "./movements-report"
import {
  ExportButton,
  ReportEmpty,
  ReportSection,
  StatGrid,
  StatTile,
  StatTone,
  useReportQuantity,
} from "./report-parts"
import { ReportsShell } from "./reports-shell"
import { useReportExport } from "./use-report-export"
import { useReportSearch } from "./use-report-search"

const PERCENT = 100

/**
 * Écarts de la période (D38) : réceptions qui ne correspondent pas au bon de livraison (de quoi
 * faire recours au fournisseur, Q12) et écarts trouvés aux inventaires (Q33).
 */
export function DiscrepancyReportScreen() {
  const { search } = useReportSearch()
  const report = useDiscrepancyReport(search)
  const exporter = useReportExport()
  const data = report.data
  return (
    <ReportsShell
      actions={
        <ExportButton
          disabled={!data}
          onExport={() => exporter.discrepancies(data!)}
        />
      }
    >
      {!data ? (
        <ReportSkeleton />
      ) : (
        <div
          className={cn(
            "space-y-10 transition-opacity",
            report.isPlaceholderData && "opacity-60"
          )}
        >
          <Totals report={data} />
          <Suppliers report={data} />
          <ReceiptGaps report={data} />
          <InventoryGaps report={data} />
        </div>
      )}
    </ReportsShell>
  )
}

function Totals({ report }: { report: DiscrepancyReport }) {
  const t = useTranslations("reports.discrepancies.totals")
  const receipts = report.suppliers.reduce((sum, row) => sum + row.receipts, 0)
  const withGap = report.suppliers.reduce(
    (sum, row) => sum + row.withDiscrepancy,
    0
  )
  return (
    <StatGrid columns={3}>
      <StatTile
        label={t("receipts")}
        value={withGap}
        hint={t("receiptsHint", { total: receipts })}
        icon={TruckIcon}
        tone={withGap > 0 ? StatTone.warning : StatTone.good}
      />
      <StatTile
        label={t("lines")}
        value={report.receiptGaps.length}
        icon={ScaleIcon}
      />
      <StatTile
        label={t("inventory")}
        value={report.inventoryGaps.length}
        hint={t("inventoryHint")}
        icon={ClipboardCheckIcon}
        tone={
          report.inventoryGaps.length > 0 ? StatTone.warning : StatTone.good
        }
      />
    </StatGrid>
  )
}

function Suppliers({ report }: { report: DiscrepancyReport }) {
  const t = useTranslations("reports.discrepancies.suppliers")
  return (
    <ReportSection title={t("title")} description={t("description")}>
      {report.suppliers.length === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {report.suppliers.map((row) => {
            const share = Math.round(
              (row.withDiscrepancy / row.receipts) * PERCENT
            )
            return (
              <li
                key={row.supplierId ?? "none"}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center sm:gap-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {row.name ?? t("none")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("count", {
                      withGap: row.withDiscrepancy,
                      count: row.receipts,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={share}
                    aria-label={t("share", { name: row.name ?? t("none") })}
                    className={cn(
                      "flex-1",
                      share > 0 &&
                        "**:data-[slot=progress-indicator]:bg-warning"
                    )}
                  />
                  <span className="w-12 text-right num text-sm font-semibold">
                    {t("percent", { share })}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </ReportSection>
  )
}

function ReceiptGaps({ report }: { report: DiscrepancyReport }) {
  const t = useTranslations("reports.discrepancies.receipts")
  const format = useFormatter()
  const quantity = useReportQuantity()
  if (report.receiptGaps.length === 0)
    return (
      <ReportSection title={t("title")} description={t("description")}>
        <ReportEmpty>{t("empty")}</ReportEmpty>
      </ReportSection>
    )
  return (
    <ReportSection title={t("title")} description={t("description")}>
      <div className="overflow-x-auto rounded-2xl border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">{t("columns.voucher")}</TableHead>
              <TableHead>{t("columns.item")}</TableHead>
              <TableHead className="text-right">
                {t("columns.expected")}
              </TableHead>
              <TableHead className="text-right">
                {t("columns.received")}
              </TableHead>
              <TableHead className="pr-4 text-right">
                {t("columns.gap")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.receiptGaps.map((row, index) => {
              const gap = row.received - row.expected
              const unit = row.item.baseUnit
              return (
                <TableRow key={`${row.voucherId}-${index}`}>
                  <TableCell className="py-3 pl-4">
                    <Link
                      href={RecordRoutes.voucher(row.voucherId)}
                      className="font-mono text-sm font-medium hover:underline"
                    >
                      {row.number}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {format.dateTime(new Date(row.occurredAt), {
                        dateStyle: "medium",
                      })}
                      {row.supplierName && ` · ${row.supplierName}`}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {row.item.name}
                  </TableCell>
                  <TableCell className="text-right num">
                    {quantity(unit, row.expected)}
                  </TableCell>
                  <TableCell className="text-right num">
                    {quantity(unit, row.received)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "pr-4 text-right num font-semibold",
                      gap < 0
                        ? "text-destructive"
                        : "text-warning-muted-foreground"
                    )}
                  >
                    {quantity(unit, gap, true)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </ReportSection>
  )
}

function InventoryGaps({ report }: { report: DiscrepancyReport }) {
  const t = useTranslations("reports.discrepancies.inventory")
  const quantity = useReportQuantity()
  return (
    <ReportSection title={t("title")} description={t("description")}>
      {report.inventoryGaps.length === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {report.inventoryGaps.map((row) => (
            <li
              key={row.item.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <ItemLink
                  itemId={row.item.id}
                  className="truncate font-medium hover:underline"
                >
                  {row.item.name}
                </ItemLink>
                <p className="text-xs text-muted-foreground">
                  {t("inventories", { count: row.inventories })}
                </p>
              </div>
              <span
                className={cn(
                  "num font-semibold",
                  row.gap < 0
                    ? "text-destructive"
                    : "text-warning-muted-foreground"
                )}
              >
                {quantity(row.item.baseUnit, row.gap, true)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ReportSection>
  )
}
