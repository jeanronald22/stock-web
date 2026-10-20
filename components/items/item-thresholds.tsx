"use client"

import { BellIcon, CheckIcon, ChevronsUpIcon } from "lucide-react"
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
 * Seuils d'alerte et stocks maximums (D44) des dépôts du rôle, pour qui règle les seuils (gérant,
 * manager, contrôleur) : un enregistrement par dépôt, sans toucher au reste de la fiche.
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
  const asText = (quantity: number | null) =>
    quantity === null ? "" : formatQuantityInput(quantity, locale)
  const [minimum, setMinimum] = useState(asText(placement.minQuantity))
  const [maximum, setMaximum] = useState(asText(placement.maxQuantity))
  const parsedMinimum = minimum.trim() ? parseQuantity(minimum) : null
  const parsedMaximum = maximum.trim() ? parseQuantity(maximum) : null
  const minimumInvalid = !!minimum.trim() && parsedMinimum === null
  // Même règle que l'API : le maximum est au-dessus du seuil, et jamais nul.
  const maximumInvalid =
    !!maximum.trim() &&
    (parsedMaximum === null ||
      parsedMaximum <= 0 ||
      (parsedMinimum !== null && parsedMaximum <= parsedMinimum))
  const unchanged =
    minimum === asText(placement.minQuantity) &&
    maximum === asText(placement.maxQuantity)

  const save = () =>
    change.mutate(
      {
        itemId: item.id,
        warehouseId: placement.warehouseId,
        minQuantity: parsedMinimum,
        maxQuantity: parsedMaximum,
      },
      {
        onSuccess: () =>
          toast.success(
            t("items.thresholdSaved", { warehouse: warehouseName })
          ),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  const input = (
    field: "min" | "max",
    value: string,
    invalid: boolean,
    onChange: (text: string) => void
  ) => {
    const id = `${field}-threshold-${placement.warehouseId}`
    const Icon = field === "min" ? BellIcon : ChevronsUpIcon
    return (
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {field === "min"
              ? t("items.form.minQuantity")
              : t("items.form.maxQuantity")}
          </span>
        </label>
        <InputGroup className="h-9">
          <InputGroupInput
            id={id}
            inputMode="decimal"
            value={value}
            aria-invalid={invalid}
            placeholder={
              field === "min"
                ? t("items.form.minQuantityPlaceholder")
                : t("items.form.maxQuantityPlaceholder")
            }
            onChange={(event) => onChange(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{unitLabel}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>
    )
  }

  return (
    <li className="rounded-xl border p-3">
      <p className="mb-2 text-sm font-medium">{warehouseName}</p>
      <div className="flex items-end gap-2">
        {input("min", minimum, minimumInvalid, setMinimum)}
        {input("max", maximum, maximumInvalid, setMaximum)}
        <Button
          type="button"
          size="icon"
          disabled={
            minimumInvalid || maximumInvalid || unchanged || change.isPending
          }
          aria-label={t("items.saveThreshold", { warehouse: warehouseName })}
          onClick={save}
        >
          {change.isPending ? <Spinner /> : <CheckIcon />}
        </Button>
      </div>
      {maximumInvalid && parsedMaximum !== null && parsedMaximum > 0 && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {t("items.form.maxQuantityAboveMin")}
        </p>
      )}
    </li>
  )
}
