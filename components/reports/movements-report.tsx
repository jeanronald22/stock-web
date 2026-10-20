"use client"

import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  PackageXIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useDeferredValue, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useMovementsReport } from "@/lib/api/report-queries"
import type { ItemMovements, MovementsReport } from "@/lib/api/reports"
import { VoucherType } from "@/lib/api/vouchers"
import { INBOUND_TYPES, OUTBOUND_TYPES, totalOf } from "@/lib/reports/activity"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { ActivityChart } from "./activity-chart"
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

/** Lignes montrées d'emblée ; « Voir plus » en ajoute autant. */
const PAGE = 50

const inbound = (row: ItemMovements) => row.received + row.returnedByCustomers
const outbound = (row: ItemMovements) => row.issued + row.returnedToSuppliers
const transfers = (row: ItemMovements) => row.transferredIn - row.transferredOut

/** Mouvements de la période (D38) : l'activité en bons, puis article par article. */
export function MovementsReportScreen() {
  const t = useTranslations("reports.movements")
  const { search } = useReportSearch()
  const report = useMovementsReport(search)
  const exporter = useReportExport()
  return (
    <ReportsShell
      actions={
        <ExportButton
          disabled={!report.data}
          onExport={() => exporter.movements(report.data!)}
        />
      }
    >
      {!report.data ? (
        <ReportSkeleton />
      ) : (
        <div
          className={cn(
            "space-y-8 transition-opacity",
            report.isPlaceholderData && "opacity-60"
          )}
        >
          <Totals report={report.data} />
          <ReportSection title={t("activity")} description={t("activityHint")}>
            <div className="rounded-2xl border p-4 sm:p-5">
              <ActivityChart activity={report.data.activity} />
            </div>
          </ReportSection>
          <ItemsTable rows={report.data.items} />
        </div>
      )}
    </ReportsShell>
  )
}

function Totals({ report }: { report: MovementsReport }) {
  const t = useTranslations("reports.movements.totals")
  const inbound = totalOf(report.totals, INBOUND_TYPES)
  const outbound = totalOf(report.totals, OUTBOUND_TYPES)
  const damage = report.totals[VoucherType.damage] ?? 0
  const adjustments = report.totals[VoucherType.adjustment] ?? 0
  return (
    <StatGrid columns={4}>
      <StatTile
        label={t("inbound")}
        value={inbound}
        hint={t("vouchers", { count: inbound })}
        icon={ArrowDownToLineIcon}
        tone={StatTone.good}
      />
      <StatTile
        label={t("outbound")}
        value={outbound}
        hint={t("vouchers", { count: outbound })}
        icon={ArrowUpFromLineIcon}
      />
      <StatTile
        label={t("damage")}
        value={damage}
        hint={t("vouchers", { count: damage })}
        icon={PackageXIcon}
        tone={StatTone.bad}
      />
      <StatTile
        label={t("adjustments")}
        value={adjustments}
        hint={t("vouchers", { count: adjustments })}
        icon={SlidersHorizontalIcon}
        tone={StatTone.warning}
      />
    </StatGrid>
  )
}

function ItemsTable({ rows }: { rows: ItemMovements[] }) {
  const t = useTranslations("reports.movements")
  const quantity = useReportQuantity()
  const [typed, setTyped] = useState("")
  const [shown, setShown] = useState(PAGE)
  const text = useDeferredValue(typed.trim().toLocaleLowerCase())
  const filtered = text
    ? rows.filter(
        (row) =>
          row.item.name.toLocaleLowerCase().includes(text) ||
          row.item.reference?.toLocaleLowerCase().includes(text)
      )
    : rows
  const visible = filtered.slice(0, shown)

  return (
    <ReportSection
      title={t("byItem")}
      description={t("byItemHint", { count: rows.length })}
      actions={
        rows.length > 0 && (
          <InputGroup className="w-full sm:w-72">
            <InputGroupInput
              type="search"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
        )
      }
    >
      {rows.length === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <>
          {/* Téléphone : une carte par article, les trois chiffres qui comptent. */}
          <ul className="divide-y rounded-2xl border md:hidden">
            {visible.map((row) => (
              <li key={row.item.id} className="px-4 py-3">
                <Link
                  href={RecordRoutes.item(row.item.id)}
                  className="font-semibold"
                >
                  {row.item.name}
                </Link>
                <p className="mt-1 num text-sm text-muted-foreground">
                  {t("compact", {
                    inbound: quantity(row.item.baseUnit, inbound(row)),
                    outbound: quantity(row.item.baseUnit, outbound(row)),
                    net: quantity(row.item.baseUnit, row.net, true),
                  })}
                </p>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-2xl border md:block">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">{t("columns.item")}</TableHead>
                  <TableHead className="text-right">
                    {t("columns.inbound")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("columns.outbound")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("columns.transfers")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("columns.damage")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("columns.adjustments")}
                  </TableHead>
                  <TableHead className="pr-4 text-right">
                    {t("columns.net")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => {
                  const unit = row.item.baseUnit
                  return (
                    <TableRow key={row.item.id}>
                      <TableCell className="py-3 pl-4">
                        <Link
                          href={RecordRoutes.item(row.item.id)}
                          className="font-medium hover:underline"
                        >
                          {row.item.name}
                        </Link>
                        {row.item.reference && (
                          <p className="font-mono text-xs text-muted-foreground">
                            {row.item.reference}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right num">
                        {quantity(unit, inbound(row))}
                      </TableCell>
                      <TableCell className="text-right num">
                        {quantity(unit, outbound(row))}
                      </TableCell>
                      <TableCell className="text-right num text-muted-foreground">
                        {quantity(unit, transfers(row), true)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right num",
                          row.damaged > 0 && "text-destructive"
                        )}
                      >
                        {quantity(unit, row.damaged)}
                      </TableCell>
                      <TableCell className="text-right num text-muted-foreground">
                        {quantity(unit, row.adjusted, true)}
                      </TableCell>
                      <TableCell className="pr-4 text-right num font-semibold">
                        {quantity(unit, row.net, true)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && <ReportEmpty>{t("noMatch")}</ReportEmpty>}
          {filtered.length > shown && (
            <Button variant="outline" onClick={() => setShown(shown + PAGE)}>
              {t("more", { count: filtered.length - shown })}
            </Button>
          )}
        </>
      )}
    </ReportSection>
  )
}

export function ReportSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <Skeleton className="h-56 rounded-2xl lg:h-28" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}
