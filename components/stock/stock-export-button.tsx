"use client"

import { useTranslations } from "next-intl"

import { useCategoryTree } from "@/components/categories/use-category-tree"
import {
  useBatchLabel,
  usePackagingBreakdown,
} from "@/components/items/describe"
import { ExportButton } from "@/components/reports/report-parts"
import { useApi } from "@/lib/api/api-provider"
import { isoDay } from "@/lib/reports/periods"
import type { StockRow, StockSearch } from "@/lib/api/vouchers"
import { downloadWorkbook } from "@/lib/import/import-files"

/** Lignes lues par appel : le plus grand paquet que l'API accepte (stock-api, PageParams.MAX_SIZE). */
const BATCH = 100
const EXTENSION = ".xlsx"

/**
 * Le stock affiché, filtres compris, en classeur Excel (D38) : toutes les pages, une ligne par
 * article ; la quantité en nombre (Excel l'additionne) et en conditionnements.
 */
export function StockExportButton({ search }: { search: StockSearch }) {
  const t = useTranslations("stock.export")
  const tUnits = useTranslations("units")
  const tStates = useTranslations("stock.state")
  const { vouchers } = useApi()
  const categories = useCategoryTree()
  const breakdown = usePackagingBreakdown()
  const batchLabel = useBatchLabel()

  const exportAll = async () => {
    const rows: StockRow[] = []
    for (let page = 0; ; page++) {
      const result = await vouchers.stock(search, page, BATCH)
      rows.push(...result.items)
      if (rows.length >= result.total || result.items.length === 0) break
    }
    await downloadWorkbook(`${t("file")}-${isoDay(new Date())}${EXTENSION}`, [
      {
        name: t("sheet"),
        headers: [
          t("item"),
          t("reference"),
          t("category"),
          t("unit"),
          t("quantity"),
          t("packagings"),
          t("state"),
          t("batches"),
          t("alerts"),
        ],
        rows: rows.map((row) => [
          row.item.name,
          row.item.reference ?? "",
          (row.item.categoryId && categories.paths.get(row.item.categoryId)) ??
            "",
          tUnits(`${row.item.baseUnit}.short`),
          row.quantity,
          breakdown(row.item, row.quantity) ?? "",
          tStates(row.state),
          row.batches
            .map(
              (batch) =>
                `${batchLabel(batch.batch ?? "", batch)} : ${batch.quantity}`
            )
            .join(" ; "),
          row.alerts
            .map((alert) => `${alert.warehouse.name} : ${alert.quantity}`)
            .join(" ; "),
        ]),
      },
    ])
  }
  return <ExportButton onExport={exportAll} />
}
