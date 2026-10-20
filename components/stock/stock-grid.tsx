"use client"

import { useTranslations } from "next-intl"

import {
  usePackagingBreakdown,
  useQuantityLabel,
} from "@/components/items/describe"
import { ITEM_GRID, ItemCard } from "@/components/items/item-card"
import { StockState } from "@/lib/api/stock"
import type { StockRow } from "@/lib/api/vouchers"
import { cn } from "@/lib/utils"

import { StockStateBadge } from "./stock-state-badge"

/**
 * Grille du stock : la quantité en grand, dite aussi en conditionnements ; l'état sur la photo ; le
 * premier dépôt en alerte en dessous. Les lots sont sur la fiche et au tableau.
 */
export function StockGrid({
  rows,
  categoryPaths,
  stale,
}: {
  rows: StockRow[]
  categoryPaths: ReadonlyMap<string, string>
  stale: boolean
}) {
  const t = useTranslations("stock")
  const quantityLabel = useQuantityLabel()
  const breakdown = usePackagingBreakdown()
  return (
    <ul className={cn(ITEM_GRID, "transition-opacity", stale && "opacity-60")}>
      {rows.map((row) => {
        const alert = row.alerts[0]
        const packs = breakdown(row.item, row.quantity)
        return (
          <ItemCard
            key={row.item.id}
            item={row.item}
            muted={row.quantity === 0}
            overlay={<StockStateBadge state={row.state} />}
            subtitle={
              row.item.categoryId && categoryPaths.get(row.item.categoryId)
            }
          >
            <p
              className={cn(
                "num text-lg font-semibold",
                row.state === StockState.out && "text-destructive"
              )}
            >
              {quantityLabel(row.item.baseUnit, row.quantity)}
            </p>
            {packs && (
              <p className="num text-xs text-muted-foreground">{packs}</p>
            )}
            {alert && (
              <p
                className={cn(
                  "mt-1 truncate text-xs",
                  alert.state === StockState.out
                    ? "text-destructive"
                    : "text-warning-muted-foreground"
                )}
              >
                {t("alert", {
                  warehouse: alert.warehouse.name,
                  quantity: quantityLabel(row.item.baseUnit, alert.quantity),
                  threshold: quantityLabel(
                    row.item.baseUnit,
                    alert.minQuantity
                  ),
                })}
              </p>
            )}
          </ItemCard>
        )
      })}
    </ul>
  )
}
