"use client"

import { BellIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import type { FieldError as FormFieldError } from "react-hook-form"

import { warehouseKindIcons } from "@/components/warehouses/warehouse-kind"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import type { Warehouse } from "@/lib/api/stock"
import { Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

/** Dépôt coché dans le formulaire ; seuil en texte, vide : pas d'alerte. */
export type PlacementValue = { warehouseId: string; minQuantity: string }

/**
 * Dépôts où l'article est proposé : une case par dépôt actif et, pour chaque dépôt coché, le seuil
 * sous lequel il faut commander (en unité de base).
 */
export function WarehouseChecklist({
  warehouses,
  value,
  onChange,
  unitLabel,
  errors,
}: {
  warehouses: Warehouse[]
  value: PlacementValue[]
  onChange: (placements: PlacementValue[]) => void
  /** Unité de base au pluriel : « pièces », « m² ». */
  unitLabel: string
  /** Erreurs des seuils, dans l'ordre de [value]. */
  errors?: ({ minQuantity?: FormFieldError } | undefined)[]
}) {
  const t = useTranslations()

  if (warehouses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-4">
        <p className="text-sm text-muted-foreground">
          {t("items.form.noWarehouse")}
        </p>
        <Link
          href={Routes.newWarehouse}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-3"
          )}
        >
          <PlusIcon />
          {t("items.form.createWarehouse")}
        </Link>
      </div>
    )
  }

  const indexes = new Map(
    value.map((placement, index) => [placement.warehouseId, index])
  )
  const visibleIds = warehouses.map((warehouse) => warehouse.id)
  const allSelected = visibleIds.every((id) => indexes.has(id))
  // Un dépôt archivé déjà coché n'est pas affiché : « tout cocher / décocher » le laisse en place.
  const hidden = value.filter(
    (placement) => !visibleIds.includes(placement.warehouseId)
  )
  const toggle = (id: string, checked: boolean) =>
    onChange(
      checked
        ? [...value, { warehouseId: id, minQuantity: "" }]
        : value.filter((placement) => placement.warehouseId !== id)
    )
  const setMinQuantity = (id: string, minQuantity: string) =>
    onChange(
      value.map((placement) =>
        placement.warehouseId === id ? { ...placement, minQuantity } : placement
      )
    )

  return (
    <div className="space-y-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {warehouses.map((warehouse) => {
          const Icon = warehouseKindIcons[warehouse.kind]
          const index = indexes.get(warehouse.id)
          const checked = index !== undefined
          const error = checked ? errors?.[index]?.minQuantity : undefined
          const thresholdId = `min-quantity-${warehouse.id}`
          return (
            <li
              key={warehouse.id}
              className={cn(
                "rounded-xl border transition-colors",
                checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              )}
            >
              <label className="flex cursor-pointer items-center gap-3 p-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => toggle(warehouse.id, next)}
                />
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {warehouse.name}
                  </span>
                  {warehouse.city && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {warehouse.city}
                    </span>
                  )}
                </span>
              </label>
              {checked && (
                <div className="px-3 pb-3">
                  <label
                    htmlFor={thresholdId}
                    className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <BellIcon className="size-3.5" aria-hidden />
                    {t("items.form.minQuantity")}
                  </label>
                  <InputGroup className="h-9 bg-background">
                    <InputGroupInput
                      id={thresholdId}
                      inputMode="decimal"
                      placeholder={t("items.form.minQuantityPlaceholder")}
                      value={value[index].minQuantity}
                      aria-invalid={!!error}
                      onChange={(event) =>
                        setMinQuantity(warehouse.id, event.target.value)
                      }
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>{unitLabel}</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError errors={[error]} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        {t("items.form.minQuantityHint")}
      </p>
      {warehouses.length > 1 && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="px-0"
          onClick={() =>
            onChange(
              allSelected
                ? hidden
                : [
                    ...value,
                    ...visibleIds
                      .filter((id) => !indexes.has(id))
                      .map((warehouseId) => ({ warehouseId, minQuantity: "" })),
                  ]
            )
          }
        >
          {allSelected ? t("items.form.selectNone") : t("items.form.selectAll")}
        </Button>
      )}
    </div>
  )
}
