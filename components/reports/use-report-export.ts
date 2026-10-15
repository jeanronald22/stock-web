"use client"

import { useTranslations } from "next-intl"
import { useCallback, useMemo } from "react"

import type {
  DamageReport,
  DiscrepancyReport,
  MovementsReport,
  ReportItem,
  ReportPeriod,
} from "@/lib/api/reports"
import { downloadWorkbook } from "@/lib/import/import-files"
import { activitySeries } from "@/lib/reports/activity"

const EXTENSION = ".xlsx"

/**
 * Rapports en classeur Excel (D38) : des nombres bruts (Excel les additionne), l'unité dans sa
 * colonne, un onglet par tableau. Le nom du fichier porte la période.
 */
export function useReportExport() {
  const t = useTranslations("reports.export")
  const tUnits = useTranslations("units")
  const tReasons = useTranslations("vouchers.reasons")

  const itemColumns = useMemo(() => [t("item"), t("reference"), t("unit")], [t])
  const itemCells = useCallback(
    (item: ReportItem) => [
      item.name,
      item.reference ?? "",
      tUnits(`${item.baseUnit}.short`),
    ],
    [tUnits]
  )
  const fileName = (kind: string, period: ReportPeriod) =>
    `${kind}-${period.from}-${period.to}${EXTENSION}`

  return {
    movements: (report: MovementsReport) =>
      downloadWorkbook(fileName(t("files.movements"), report.period), [
        {
          name: t("sheets.byItem"),
          headers: [
            ...itemColumns,
            t("received"),
            t("returnedByCustomers"),
            t("issued"),
            t("returnedToSuppliers"),
            t("transferredIn"),
            t("transferredOut"),
            t("damaged"),
            t("adjusted"),
            t("net"),
          ],
          rows: report.items.map((row) => [
            ...itemCells(row.item),
            row.received,
            row.returnedByCustomers,
            row.issued,
            row.returnedToSuppliers,
            row.transferredIn,
            row.transferredOut,
            row.damaged,
            row.adjusted,
            row.net,
          ]),
        },
        {
          name: t("sheets.activity"),
          headers: [t("day"), t("inboundVouchers"), t("outboundVouchers")],
          rows: activitySeries(report.activity).map((point) => [
            point.day,
            point.inbound,
            point.outbound,
          ]),
        },
      ]),
    damage: (report: DamageReport) =>
      downloadWorkbook(fileName(t("files.damage"), report.period), [
        {
          name: t("sheets.byItem"),
          headers: [...itemColumns, t("damaged"), t("occurrences")],
          rows: report.items.map((row) => [
            ...itemCells(row.item),
            row.quantity,
            row.vouchers,
          ]),
        },
        {
          name: t("sheets.byReason"),
          headers: [t("reason"), t("vouchers"), t("lines")],
          rows: report.byReason.map((row) => [
            tReasons(`${row.reason}.label`),
            row.vouchers,
            row.lines,
          ]),
        },
      ]),
    discrepancies: (report: DiscrepancyReport) =>
      downloadWorkbook(fileName(t("files.discrepancies"), report.period), [
        {
          name: t("sheets.receiptGaps"),
          headers: [
            t("date"),
            t("voucher"),
            t("supplier"),
            ...itemColumns,
            t("expected"),
            t("received"),
            t("gap"),
          ],
          rows: report.receiptGaps.map((row) => [
            row.occurredAt.slice(0, 10),
            row.number,
            row.supplierName ?? "",
            ...itemCells(row.item),
            row.expected,
            row.received,
            row.received - row.expected,
          ]),
        },
        {
          name: t("sheets.suppliers"),
          headers: [t("supplier"), t("receipts"), t("withDiscrepancy")],
          rows: report.suppliers.map((row) => [
            row.name ?? t("noSupplier"),
            row.receipts,
            row.withDiscrepancy,
          ]),
        },
        {
          name: t("sheets.inventoryGaps"),
          headers: [...itemColumns, t("gap"), t("inventories")],
          rows: report.inventoryGaps.map((row) => [
            ...itemCells(row.item),
            row.gap,
            row.inventories,
          ]),
        },
      ]),
  }
}
