"use client"

import { useTranslations } from "next-intl"

import { warehouseKindIcons } from "@/components/warehouses/warehouse-kind"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Warehouse } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

/**
 * Dépôts où les articles sont proposés (le seuil du fichier vaut dans chacun) et, si le fichier a
 * une colonne de stock, le dépôt où ce stock se trouve.
 */
export function ImportWarehousesStep({
  warehouses,
  selected,
  onSelected,
  stockMapped,
  openingCandidates,
  openingWarehouseId,
  onOpeningWarehouse,
}: {
  warehouses: Warehouse[]
  selected: string[]
  onSelected: (ids: string[]) => void
  /** Le fichier a une colonne « stock actuel ». */
  stockMapped: boolean
  /** Dépôts cochés où l'on peut poser le stock (droit de correction). */
  openingCandidates: Warehouse[]
  openingWarehouseId: string | null
  onOpeningWarehouse: (id: string) => void
}) {
  const t = useTranslations("import.warehouses")
  const toggle = (id: string, checked: boolean) =>
    onSelected(
      checked ? [...selected, id] : selected.filter((other) => other !== id)
    )
  return (
    <div className="space-y-8">
      <fieldset className="space-y-2">
        <legend className="sr-only">{t("label")}</legend>
        {warehouses.map((warehouse) => {
          const Icon = warehouseKindIcons[warehouse.kind]
          const checked = selected.includes(warehouse.id)
          return (
            <label
              key={warehouse.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                checked
                  ? "border-primary bg-primary/5"
                  : "hover:border-foreground/20"
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => toggle(warehouse.id, value)}
              />
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              <span className="font-medium">{warehouse.name}</span>
            </label>
          )
        })}
      </fieldset>

      {stockMapped && (
        <Field>
          <FieldLabel htmlFor="import-opening-warehouse">
            {t("opening.label")}
          </FieldLabel>
          {openingCandidates.length > 0 ? (
            <Select
              items={openingCandidates.map((warehouse) => ({
                value: warehouse.id,
                label: warehouse.name,
              }))}
              value={openingWarehouseId}
              onValueChange={(value) => value && onOpeningWarehouse(value)}
            >
              <SelectTrigger id="import-opening-warehouse" className="w-full">
                <SelectValue placeholder={t("opening.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {openingCandidates.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <FieldDescription>
            {openingCandidates.length > 0
              ? t("opening.hint")
              : t("opening.unavailable")}
          </FieldDescription>
        </Field>
      )}
    </div>
  )
}
