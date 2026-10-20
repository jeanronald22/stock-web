"use client"

import { useTranslations } from "next-intl"

import {
  useBatchLabel,
  usePackagingBreakdown,
  useQuantityLabel,
} from "@/components/items/describe"
import { ItemLink } from "@/components/items/item-link"
import { ItemThumb } from "@/components/items/item-thumb"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StockState } from "@/lib/api/stock"
import type { StockRow } from "@/lib/api/vouchers"
import { cn } from "@/lib/utils"

import { StockLevelBadge } from "./stock-state-badge"

/**
 * Tableau du stock : l'article, sa quantité en unité et en conditionnements, son état, les dépôts en
 * alerte. Sur téléphone, l'article et la quantité, l'état sous la quantité. Toute la ligne ouvre la
 * fiche.
 */
export function StockTable({
  rows,
  categoryPaths,
  stale,
}: {
  rows: StockRow[]
  categoryPaths: ReadonlyMap<string, string>
  /** Page précédente affichée pendant le chargement de la suivante. */
  stale: boolean
}) {
  const t = useTranslations("stock")
  const quantityLabel = useQuantityLabel()
  const breakdown = usePackagingBreakdown()
  const batchLabel = useBatchLabel()
  // Aucun article suivi par lot sur la page : la colonne « Lots » resterait vide.
  const showBatches = rows.some((row) => row.batches.length > 0)
  const showAlerts = rows.some((row) => row.alerts.length > 0)

  return (
    <Table className={cn("transition-opacity", stale && "opacity-60")}>
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">{t("table.item")}</TableHead>
          <TableHead className="hidden lg:table-cell">
            {t("table.packagings")}
          </TableHead>
          {showBatches && (
            <TableHead className="hidden xl:table-cell">
              {t("table.batches")}
            </TableHead>
          )}
          {showAlerts && (
            <TableHead className="hidden xl:table-cell">
              {t("table.alerts")}
            </TableHead>
          )}
          <TableHead className="hidden md:table-cell">
            {t("table.state")}
          </TableHead>
          <TableHead className="pr-4 text-right">
            {t("table.quantity")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const category =
            row.item.categoryId && categoryPaths.get(row.item.categoryId)
          const packs = breakdown(row.item, row.quantity)
          return (
            <TableRow key={row.item.id} className="relative cursor-pointer">
              <TableCell className="py-2.5 pl-4 whitespace-normal">
                <div className="flex items-center gap-3">
                  <ItemThumb imageUrl={row.item.imageUrl} />
                  <div className="min-w-0">
                    <ItemLink
                      itemId={row.item.id}
                      stretched
                      className="line-clamp-1 font-medium hover:underline"
                    >
                      {row.item.name}
                    </ItemLink>
                    {category && (
                      <p className="truncate text-xs text-muted-foreground">
                        {category}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden num text-xs text-muted-foreground lg:table-cell">
                {packs ?? "—"}
              </TableCell>
              {showBatches && (
                <TableCell className="hidden xl:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {row.batches.map((batch) => (
                      <Badge
                        key={batch.batch}
                        variant="outline"
                        className="font-normal"
                      >
                        {batchLabel(batch.batch ?? "", batch)} ·{" "}
                        {quantityLabel(row.item.baseUnit, batch.quantity)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              )}
              {showAlerts && (
                <TableCell className="hidden text-xs whitespace-normal xl:table-cell">
                  <StockAlerts row={row} />
                </TableCell>
              )}
              <TableCell className="hidden md:table-cell">
                <StockLevelBadge state={row.state} quantity={row.quantity} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <span
                  className={cn(
                    "num font-semibold",
                    row.state === StockState.out && "text-destructive",
                    row.quantity === 0 &&
                      row.state === StockState.ok &&
                      "text-muted-foreground"
                  )}
                >
                  {quantityLabel(row.item.baseUnit, row.quantity)}
                </span>
                <div className="mt-1 md:hidden">
                  <StockLevelBadge state={row.state} quantity={row.quantity} />
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

/** Dépôts en alerte : « Boutique Akwa : 3 pièces, seuil 5 ». */
function StockAlerts({ row }: { row: StockRow }) {
  const t = useTranslations("stock")
  const quantityLabel = useQuantityLabel()
  return (
    <ul className="space-y-0.5">
      {row.alerts.map((alert) => (
        <li
          key={alert.warehouse.id}
          className={
            alert.state === StockState.out
              ? "text-destructive"
              : "text-warning-muted-foreground"
          }
        >
          {t("alert", {
            warehouse: alert.warehouse.name,
            quantity: quantityLabel(row.item.baseUnit, alert.quantity),
            threshold: quantityLabel(row.item.baseUnit, alert.minQuantity),
          })}
        </li>
      ))}
    </ul>
  )
}
