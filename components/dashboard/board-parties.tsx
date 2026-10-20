"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ActivityAnalysis, WarehouseActivity } from "@/lib/api/reports"
import { RecordRoutes, Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import {
  BoardCard,
  RankedRow,
  ReportEmpty,
  StatTone,
} from "@/components/reports/report-parts"

/** Un seul dépôt : les chiffres d'ensemble le disent déjà. */
const MIN_WAREHOUSES = 2

/** Dépôt par dépôt : les bons de la période, les seuils d'aujourd'hui. Un seul dépôt : rien. */
export function WarehousesCard({
  warehouses,
  className,
}: {
  warehouses: WarehouseActivity[]
  className?: string
}) {
  const t = useTranslations("analysis.warehouses")
  if (warehouses.length < MIN_WAREHOUSES) return null
  const count = (value: number, tone?: string) => (
    <span className={cn("num", value === 0 ? "text-muted-foreground" : tone)}>
      {value === 0 ? "—" : value}
    </span>
  )
  return (
    <BoardCard
      title={t("title")}
      description={t("description")}
      className={className}
    >
      {/* Téléphone : une ligne par dépôt. */}
      <ul className="divide-y md:hidden">
        {warehouses.map((warehouse) => (
          <li key={warehouse.warehouseId} className="py-3 first:pt-0 last:pb-0">
            <Link
              href={RecordRoutes.warehouse(warehouse.warehouseId)}
              className="font-semibold hover:underline"
            >
              {warehouse.name}
            </Link>
            <p className="mt-1 num text-sm text-muted-foreground">
              {t("compact", {
                inbound: warehouse.inbound,
                outbound: warehouse.outbound,
                damage: warehouse.damage,
              })}
            </p>
            {(warehouse.alerts > 0 || warehouse.out > 0) && (
              <p className="mt-0.5 num text-sm text-warning-muted-foreground">
                {t("alertsCompact", {
                  alerts: warehouse.alerts,
                  out: warehouse.out,
                })}
              </p>
            )}
          </li>
        ))}
      </ul>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-0">{t("columns.warehouse")}</TableHead>
            <TableHead className="text-right">{t("columns.inbound")}</TableHead>
            <TableHead className="text-right">
              {t("columns.outbound")}
            </TableHead>
            <TableHead className="text-right">{t("columns.damage")}</TableHead>
            <TableHead className="text-right">{t("columns.alerts")}</TableHead>
            <TableHead className="pr-0 text-right">
              {t("columns.out")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((warehouse) => (
            <TableRow key={warehouse.warehouseId}>
              <TableCell className="py-3 pl-0">
                <Link
                  href={RecordRoutes.warehouse(warehouse.warehouseId)}
                  className="font-medium hover:underline"
                >
                  {warehouse.name}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {count(warehouse.inbound)}
              </TableCell>
              <TableCell className="text-right">
                {count(warehouse.outbound)}
              </TableCell>
              <TableCell className="text-right">
                {count(warehouse.damage, "text-destructive")}
              </TableCell>
              <TableCell className="text-right">
                {count(warehouse.alerts, "text-warning-muted-foreground")}
              </TableCell>
              <TableCell className="pr-0 text-right font-semibold">
                {count(warehouse.out, "text-destructive")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </BoardCard>
  )
}

export function DamageCard({
  analysis,
  query,
}: {
  analysis: ActivityAnalysis
  query: string
}) {
  const t = useTranslations("analysis.damage")
  const tReasons = useTranslations("vouchers.reasons")
  const rows = analysis.damageByReason
  const total = rows.reduce((sum, row) => sum + row.lines, 0)
  return (
    <BoardCard
      title={t("title")}
      description={t("description")}
      link={{ href: `${Routes.reportsDamage}?${query}`, label: t("details") }}
    >
      {rows.length === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <RankedRow
              key={row.reason}
              label={tReasons(`${row.reason}.label`)}
              value={t("share", {
                share: Math.round((row.lines / total) * 100),
              })}
              detail={t("lines", { count: row.lines })}
              share={row.lines / total}
              tone={StatTone.bad}
            />
          ))}
        </ul>
      )}
    </BoardCard>
  )
}

export function SuppliersCard({
  analysis,
  query,
}: {
  analysis: ActivityAnalysis
  query: string
}) {
  const t = useTranslations("analysis.suppliers")
  const rows = analysis.suppliers
  return (
    <BoardCard
      title={t("title")}
      description={t("description")}
      link={{
        href: `${Routes.reportsDiscrepancies}?${query}`,
        label: t("details"),
      }}
    >
      {rows.length === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <RankedRow
              key={row.supplierId ?? "none"}
              label={row.name ?? t("none")}
              value={t("count", {
                withGap: row.withDiscrepancy,
                count: row.receipts,
              })}
              share={row.withDiscrepancy / row.receipts}
              tone={StatTone.warning}
            />
          ))}
        </ul>
      )}
    </BoardCard>
  )
}

export function CustomersCard({ analysis }: { analysis: ActivityAnalysis }) {
  const t = useTranslations("analysis.customers")
  const rows = analysis.customers
  const max = Math.max(1, ...rows.map((row) => row.vouchers))
  return (
    <BoardCard title={t("title")} description={t("description")}>
      {rows.length === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <ol className="space-y-3">
          {rows.map((row) => (
            <RankedRow
              key={row.customerId ?? "none"}
              label={
                row.customerId ? (
                  <Link
                    href={RecordRoutes.customer(row.customerId)}
                    className="hover:underline"
                  >
                    {row.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{t("none")}</span>
                )
              }
              value={t("vouchers", { count: row.vouchers })}
              share={row.vouchers / max}
            />
          ))}
        </ol>
      )}
    </BoardCard>
  )
}

export function TeamCard({ analysis }: { analysis: ActivityAnalysis }) {
  const t = useTranslations("analysis.team")
  const rows = analysis.team
  const max = Math.max(1, ...rows.map((row) => row.vouchers))
  return (
    <BoardCard title={t("title")} description={t("description")}>
      {rows.length === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <ol className="space-y-3">
          {rows.map((row) => (
            <RankedRow
              key={row.userId}
              label={row.name}
              value={t("vouchers", { count: row.vouchers })}
              detail={t("detail", {
                inbound: row.inbound,
                outbound: row.outbound,
                corrections: row.corrections,
              })}
              share={row.vouchers / max}
              tone={StatTone.good}
            />
          ))}
        </ol>
      )}
    </BoardCard>
  )
}
