"use client"

import {
  BellIcon,
  ChevronsUpIcon,
  PlusIcon,
  type LucideIcon,
} from "lucide-react"
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

/** Dépôt coché dans le formulaire ; seuil et maximum en texte, vides : pas d'alerte. */
export type PlacementValue = {
  warehouseId: string
  minQuantity: string
  maxQuantity: string
}

type QuantityField = "minQuantity" | "maxQuantity"

/**
 * Dépôts où l'article est proposé : une case par dépôt actif et, pour chaque dépôt coché, le seuil
 * sous lequel il faut commander et le stock maximum au-dessus duquel il y a surstock (D44), en
 * unité de base.
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
  /** Erreurs des seuils et maximums, dans l'ordre de [value]. */
  errors?: (Partial<Record<QuantityField, FormFieldError>> | undefined)[]
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
        ? [...value, emptyPlacement(id)]
        : value.filter((placement) => placement.warehouseId !== id)
    )
  const setQuantity = (id: string, field: QuantityField, text: string) =>
    onChange(
      value.map((placement) =>
        placement.warehouseId === id
          ? { ...placement, [field]: text }
          : placement
      )
    )

  return (
    <div className="space-y-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {warehouses.map((warehouse) => {
          const Icon = warehouseKindIcons[warehouse.kind]
          const index = indexes.get(warehouse.id)
          const checked = index !== undefined
          return (
            <li
              key={warehouse.id}
              className={cn(
                "@container rounded-xl border transition-colors",
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
                // Carte étroite : les deux seuils l'un sous l'autre, pour qu'une quantité à quatre chiffres et son unité restent lisibles.
                <div className="grid gap-2 px-3 pb-3 @sm:grid-cols-2">
                  <QuantityInput
                    id={`min-quantity-${warehouse.id}`}
                    icon={BellIcon}
                    label={t("items.form.minQuantity")}
                    placeholder={t("items.form.minQuantityPlaceholder")}
                    unitLabel={unitLabel}
                    value={value[index].minQuantity}
                    error={errors?.[index]?.minQuantity}
                    onChange={(text) =>
                      setQuantity(warehouse.id, "minQuantity", text)
                    }
                  />
                  <QuantityInput
                    id={`max-quantity-${warehouse.id}`}
                    icon={ChevronsUpIcon}
                    label={t("items.form.maxQuantity")}
                    placeholder={t("items.form.maxQuantityPlaceholder")}
                    unitLabel={unitLabel}
                    value={value[index].maxQuantity}
                    error={errors?.[index]?.maxQuantity}
                    onChange={(text) =>
                      setQuantity(warehouse.id, "maxQuantity", text)
                    }
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        {t("items.form.minQuantityHint")} {t("items.form.maxQuantityHint")}
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
                      .map(emptyPlacement),
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

function emptyPlacement(warehouseId: string): PlacementValue {
  return { warehouseId, minQuantity: "", maxQuantity: "" }
}

function QuantityInput({
  id,
  icon: Icon,
  label,
  placeholder,
  unitLabel,
  value,
  error,
  onChange,
}: {
  id: string
  icon: LucideIcon
  label: string
  placeholder: string
  unitLabel: string
  value: string
  error: FormFieldError | undefined
  onChange: (text: string) => void
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </label>
      <InputGroup className="h-9 bg-background">
        <InputGroupInput
          id={id}
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          aria-invalid={!!error}
          onChange={(event) => onChange(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{unitLabel}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <FieldError errors={[error]} />
    </div>
  )
}
