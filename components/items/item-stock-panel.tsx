"use client"

import { LayersIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import type { Item } from "@/lib/api/stock"
import { useItemStock } from "@/lib/api/voucher-queries"

import { useBatchLabel, useQuantityLabel } from "./describe"

/** Stock de l'article sur sa fiche, dépôt par dépôt et lot par lot. */
export function ItemStockPanel({ item }: { item: Item }) {
  const t = useTranslations("stock")
  const quantityLabel = useQuantityLabel()
  const batchLabel = useBatchLabel()
  const stock = useItemStock(item.id)
  const warehouses = stock.data?.warehouses ?? []

  return (
    <section className="mb-10 rounded-2xl border bg-muted/30 p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <LayersIcon className="size-4 text-primary" aria-hidden />
        {t("byWarehouse")}
      </h2>
      {stock.isSuccess && warehouses.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">{t("noStock")}</p>
      )}
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {warehouses.map((entry) => (
          <li
            key={entry.warehouse.id}
            className="rounded-xl border bg-background p-4"
          >
            <p className="text-sm text-muted-foreground">
              {entry.warehouse.name}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {quantityLabel(item.baseUnit, entry.quantity)}
            </p>
            {entry.batches.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.batches.map((batch) => (
                  <Badge
                    key={batch.batch}
                    variant="outline"
                    className="font-normal"
                  >
                    {batchLabel(batch.batch ?? "", batch)} ·{" "}
                    {quantityLabel(item.baseUnit, batch.quantity)}
                  </Badge>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
