"use client"

import { BellIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ItemLocationPicker } from "@/components/locations/item-location-picker"
import { RecordSection } from "@/components/records/record-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useStockAccess } from "@/components/workspace/stock-access"
import {
  CatalogStatus,
  StockPermission,
  type Item,
  type Warehouse,
} from "@/lib/api/stock"

import { useBatchLabel, useQuantityLabel } from "./describe"
import { ItemThresholds } from "./item-thresholds"
import { ItemWarehouseChart } from "./item-warehouse-chart"
import type { WarehouseLine } from "./use-item-warehouses"

/** Dépôt par dépôt : stock, seuil d'alerte et état ; lots avec leur nuance. */
export function ItemWarehouseStock({
  item,
  lines,
  warehouses,
}: {
  item: Item
  lines: WarehouseLine[]
  warehouses: Warehouse[]
}) {
  const t = useTranslations("items.detail")
  const quantityLabel = useQuantityLabel()
  const batchLabel = useBatchLabel()
  const { can, covers } = useStockAccess()
  const canSetThresholds = can(StockPermission.setThresholds)
  const canArrange = can(StockPermission.manageLocations)
  const [thresholds, setThresholds] = useState(false)

  return (
    <RecordSection
      id="item-warehouses-title"
      title={t("byWarehouse")}
      description={t("byWarehouseHint")}
      actions={
        canSetThresholds &&
        item.warehouses.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setThresholds(true)}
          >
            <BellIcon />
            {t("thresholds")}
          </Button>
        )
      }
    >
      {lines.length === 0 ? (
        <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          {t("noWarehouse")}
        </p>
      ) : (
        <>
          <ItemWarehouseChart
            baseUnit={item.baseUnit}
            bars={lines.map((line) => ({
              name: line.warehouse.name,
              quantity: line.stock?.quantity ?? 0,
              minQuantity: line.minQuantity,
              state: line.state,
            }))}
          />
          {/* Les quantités sont sur le graphique : ici, où le trouver et quels lots. */}
          <h3 className="mt-6 mb-2 label-caps">{t("whereToFind")}</h3>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li
                key={line.warehouse.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1"
              >
                <p className="w-40 min-w-0 truncate font-medium">
                  {line.warehouse.name}
                </p>
                <ItemLocationPicker
                  itemId={item.id}
                  itemName={item.name}
                  warehouseId={line.warehouse.id}
                  location={line.location}
                  editable={
                    canArrange &&
                    covers(line.warehouse.id) &&
                    item.status === CatalogStatus.active
                  }
                />
                {(line.stock?.batches.length ?? 0) > 0 && (
                  <ul
                    className="flex flex-wrap gap-1"
                    aria-label={t("batches")}
                  >
                    {line.stock!.batches.map((batch) => (
                      <li key={batch.batch}>
                        <Badge variant="secondary" className="font-normal">
                          {batchLabel(batch.batch ?? "", batch)} ·{" "}
                          {quantityLabel(item.baseUnit, batch.quantity)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <Sheet open={thresholds} onOpenChange={setThresholds}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{t("thresholds")}</SheetTitle>
            <SheetDescription>{t("thresholdsHint")}</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <ItemThresholds item={item} warehouses={warehouses} bare />
          </div>
        </SheetContent>
      </Sheet>
    </RecordSection>
  )
}
