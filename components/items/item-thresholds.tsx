"use client"

import { BellIcon, CheckIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { FormSection } from "@/components/catalog/form-section"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { useStockAccess } from "@/components/workspace/stock-access"
import type { Item, ItemPlacement, Warehouse } from "@/lib/api/stock"
import { useChangeThreshold } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { formatQuantityInput, parseQuantity } from "@/lib/forms/quantity"

/**
 * Seuils d'alerte des dépôts du rôle, pour qui règle les seuils (gérant, manager, contrôleur) : un
 * enregistrement par dépôt, sans toucher au reste de la fiche.
 */
export function ItemThresholds({
  item,
  warehouses,
  bare = false,
}: {
  item: Item
  warehouses: Warehouse[]
  /** Sans titre de section : dans un panneau qui a déjà le sien. */
  bare?: boolean
}) {
  const t = useTranslations()
  const { covers } = useStockAccess()
  const names = new Map(
    warehouses.map((warehouse) => [warehouse.id, warehouse.name])
  )
  const placements = item.warehouses.filter(
    (placement) =>
      covers(placement.warehouseId) && names.has(placement.warehouseId)
  )
  if (placements.length === 0) return null
  const list = (
    <ul className={bare ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
      {placements.map((placement) => (
        <ThresholdRow
          key={placement.warehouseId}
          item={item}
          placement={placement}
          warehouseName={names.get(placement.warehouseId) ?? ""}
          unitLabel={t(`units.${item.baseUnit}.short`)}
        />
      ))}
    </ul>
  )
  if (bare) return list
  return (
    <FormSection
      title={t("items.form.minQuantity")}
      description={t("items.form.minQuantityHint")}
    >
      {list}
    </FormSection>
  )
}

function ThresholdRow({
  item,
  placement,
  warehouseName,
  unitLabel,
}: {
  item: Item
  placement: ItemPlacement
  warehouseName: string
  unitLabel: string
}) {
  const t = useTranslations()
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const change = useChangeThreshold()
  const initial =
    placement.minQuantity === null
      ? ""
      : formatQuantityInput(placement.minQuantity, locale)
  const [value, setValue] = useState(initial)
  const parsed = value.trim() ? parseQuantity(value) : null
  const invalid = !!value.trim() && parsed === null
  const id = `threshold-${placement.warehouseId}`

  const save = () =>
    change.mutate(
      {
        itemId: item.id,
        warehouseId: placement.warehouseId,
        minQuantity: parsed,
      },
      {
        onSuccess: () =>
          toast.success(
            t("items.thresholdSaved", { warehouse: warehouseName })
          ),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  return (
    <li className="rounded-xl border p-3">
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-1.5 text-sm font-medium"
      >
        <BellIcon className="size-4 text-muted-foreground" aria-hidden />
        {warehouseName}
      </label>
      <div className="flex gap-2">
        <InputGroup className="h-9">
          <InputGroupInput
            id={id}
            inputMode="decimal"
            value={value}
            aria-invalid={invalid}
            placeholder={t("items.form.minQuantityPlaceholder")}
            onChange={(event) => setValue(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{unitLabel}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <Button
          type="button"
          size="icon"
          disabled={invalid || value === initial || change.isPending}
          aria-label={t("items.saveThreshold", { warehouse: warehouseName })}
          onClick={save}
        >
          {change.isPending ? <Spinner /> : <CheckIcon />}
        </Button>
      </div>
    </li>
  )
}
