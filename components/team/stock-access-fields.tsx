"use client"

import { useTranslations } from "next-intl"

import { Checkbox } from "@/components/ui/checkbox"
import { warehouseKindIcons } from "@/components/warehouses/warehouse-kind"
import { useWarehouses } from "@/lib/api/stock-queries"
import {
  CatalogStatus,
  StockRole,
  stockRoles,
  type WarehouseKind,
} from "@/lib/api/stock"
import { cn } from "@/lib/utils"

/** Choix « aucun accès à Stock » à côté des rôles (aucun rôle Stock ne porte ce nom). */
export const NO_STOCK_ROLE = "NONE"
export type StockRoleChoice = StockRole | typeof NO_STOCK_ROLE

/** Un rôle autre que gérant n'a accès qu'à ses dépôts (stock-api, StockRole.allWarehouses). */
export function needsWarehouses(role: StockRoleChoice): boolean {
  return role !== NO_STOCK_ROLE && role !== StockRole.generalManager
}

/** Une carte par rôle Stock, avec ce qu'il permet, et « aucun accès ». */
export function StockRoleField({
  value,
  onChange,
}: {
  value: StockRoleChoice
  onChange: (role: StockRoleChoice) => void
}) {
  const t = useTranslations("team.stockRoles")
  const options: StockRoleChoice[] = [...stockRoles, NO_STOCK_ROLE]
  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="grid gap-2 sm:grid-cols-2"
    >
      {options.map((role) => (
        <ChoiceCard
          key={role}
          selected={value === role}
          label={t(`${role}.label`)}
          hint={t(`${role}.hint`)}
          onSelect={() => onChange(role)}
        />
      ))}
    </div>
  )
}

/** Dépôts attribués : une case par dépôt actif. */
export function AssignedWarehousesField({
  value,
  onChange,
  invalid,
}: {
  value: string[]
  onChange: (warehouseIds: string[]) => void
  invalid?: boolean
}) {
  const t = useTranslations("team.stockRoles")
  // Relue à l'ouverture : un dépôt vient peut-être d'être déclaré.
  const warehouses =
    useWarehouses(CatalogStatus.active, { fresh: true }).data ?? []
  if (warehouses.length === 0)
    return <p className="text-sm text-muted-foreground">{t("noWarehouse")}</p>
  return (
    <ul aria-label={t("warehouses")} className="grid gap-2 sm:grid-cols-2">
      {warehouses.map((warehouse) => {
        const checked = value.includes(warehouse.id)
        return (
          <li key={warehouse.id}>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-colors",
                checked ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                invalid && "border-destructive"
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(next) =>
                  onChange(
                    next
                      ? [...value, warehouse.id]
                      : value.filter((id) => id !== warehouse.id)
                  )
                }
              />
              <WarehouseKindIcon
                kind={warehouse.kind}
                className="size-4 text-muted-foreground"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{warehouse.name}</span>
                {warehouse.city && (
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {warehouse.city}
                  </span>
                )}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}

/** Carte de choix, même dessin que les unités de comptage et les types de dépôt. */
export function ChoiceCard({
  selected,
  label,
  hint,
  onSelect,
  disabled,
}: {
  selected: boolean
  label: string
  hint: string
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-3 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:border-foreground/20 hover:bg-muted/40"
      )}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
    </button>
  )
}

function WarehouseKindIcon({
  kind,
  className,
}: {
  kind: WarehouseKind
  className?: string
}) {
  const Icon = warehouseKindIcons[kind]
  return <Icon className={className} aria-hidden />
}
