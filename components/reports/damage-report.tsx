"use client"

import { BoxesIcon, ListIcon, PackageXIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDamageReport } from "@/lib/api/report-queries"
import type { DamageByReason } from "@/lib/api/reports"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { ReportSkeleton } from "./movements-report"
import {
  ExportButton,
  ReportEmpty,
  ReportSection,
  StatTile,
  StatTone,
  useReportQuantity,
} from "./report-parts"
import { ReportsShell } from "./reports-shell"
import { useReportExport } from "./use-report-export"
import { useReportSearch } from "./use-report-search"

/** Hauteur d'une barre de motif dans le graphique, en pixels. */
const REASON_ROW = 44

/** Casse de la période (D38, Q34-Q36) : pourquoi, et quels articles. */
export function DamageReportScreen() {
  const t = useTranslations("reports.damage")
  const { search } = useReportSearch()
  const report = useDamageReport(search)
  const exporter = useReportExport()
  const quantity = useReportQuantity()
  const data = report.data
  return (
    <ReportsShell
      actions={
        <ExportButton
          disabled={!data}
          onExport={() => exporter.damage(data!)}
        />
      }
    >
      {!data ? (
        <ReportSkeleton />
      ) : (
        <div
          className={cn(
            "space-y-8 transition-opacity",
            report.isPlaceholderData && "opacity-60"
          )}
        >
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile
              label={t("vouchers")}
              value={data.vouchers}
              icon={PackageXIcon}
              tone={data.vouchers > 0 ? StatTone.bad : StatTone.neutral}
            />
            <StatTile
              label={t("lines")}
              value={data.byReason.reduce((sum, row) => sum + row.lines, 0)}
              icon={ListIcon}
            />
            <StatTile
              label={t("items")}
              value={data.items.length}
              icon={BoxesIcon}
            />
          </dl>
          {data.vouchers === 0 ? (
            <ReportEmpty>{t("empty")}</ReportEmpty>
          ) : (
            <>
              <ReportSection
                title={t("byReason")}
                description={t("byReasonHint")}
              >
                <div className="rounded-2xl border p-4 sm:p-5">
                  <ReasonChart rows={data.byReason} />
                </div>
              </ReportSection>
              <ReportSection title={t("byItem")} description={t("byItemHint")}>
                <div className="overflow-hidden rounded-2xl border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-4">
                          {t("columns.item")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("columns.quantity")}
                        </TableHead>
                        <TableHead className="pr-4 text-right">
                          {t("columns.times")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((row) => (
                        <TableRow key={row.item.id}>
                          <TableCell className="py-3 pl-4 whitespace-normal">
                            <Link
                              href={RecordRoutes.item(row.item.id)}
                              className="font-medium hover:underline"
                            >
                              {row.item.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right text-destructive tabular-nums">
                            {quantity(row.item.baseUnit, row.quantity)}
                          </TableCell>
                          <TableCell className="pr-4 text-right tabular-nums">
                            {t("times", { count: row.vouchers })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ReportSection>
            </>
          )}
        </div>
      )}
    </ReportsShell>
  )
}

/** Lignes de casse par motif, en barres horizontales : le motif se lit en entier. */
function ReasonChart({ rows }: { rows: DamageByReason[] }) {
  const t = useTranslations("reports.damage")
  const tReasons = useTranslations("vouchers.reasons")
  const data = rows.map((row) => ({
    reason: tReasons(`${row.reason}.label`),
    lines: row.lines,
  }))
  const config = {
    lines: { label: t("linesLabel"), color: "var(--destructive)" },
  } satisfies ChartConfig
  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: Math.max(2, data.length) * REASON_ROW }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="reason"
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="lines" fill="var(--color-lines)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
