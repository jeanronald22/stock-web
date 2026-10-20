"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { CatalogStatus, type Item } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

import { ITEM_GRID, ItemCard } from "./item-card"

/** Grille des articles : photo, nom et catégorie, puis unité et dépôts. La référence reste au tableau. */
export function ItemsGrid({
  items,
  categoryPaths,
  stale,
}: {
  items: Item[]
  categoryPaths: ReadonlyMap<string, string>
  stale: boolean
}) {
  const t = useTranslations()
  return (
    <ul className={cn(ITEM_GRID, "transition-opacity", stale && "opacity-60")}>
      {items.map((item) => {
        const archived = item.status === CatalogStatus.archived
        const category = item.categoryId
          ? categoryPaths.get(item.categoryId)
          : undefined
        return (
          <ItemCard
            key={item.id}
            item={item}
            muted={archived}
            overlay={
              archived && (
                <Badge variant="secondary">{t("items.restore.badge")}</Badge>
              )
            }
            subtitle={category}
          >
            <p className="text-sm text-muted-foreground">
              {t(`units.${item.baseUnit}.label`)} ·{" "}
              {t("items.warehouseCount", { count: item.warehouses.length })}
            </p>
          </ItemCard>
        )
      })}
    </ul>
  )
}
