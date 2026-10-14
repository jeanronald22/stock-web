"use client"

import { useTranslations } from "next-intl"

import { Checkbox } from "@/components/ui/checkbox"
import { useWarehouses } from "@/lib/api/stock-queries"
import { CatalogStatus, StockRole, stockRoles } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

/** Accès Stock en cours de saisie ; role null : aucun accès à Stock. */
export type StockAccessValue = {
  role: StockRole | null
  warehouseIds: string[]
}

export const NO_STOCK_ACCESS: StockAccessValue = {
  role: null,
  warehouseIds: [],
}

/** Un rôle autre que gérant exige au moins un dépôt (stock-api, StockAccessService). */
export function isAccessComplete(value: StockAccessValue): boolean {
  return (
    value.role === null ||
    value.role === StockRole.generalManager ||
    value.warehouseIds.length > 0
  )
}

/** Rôle Stock (une carte par rôle, avec ce qu'il permet) et dépôts attribués. */
export function StockAccessFields({
  value,
  onChange,
}: {
  value: StockAccessValue
  onChange: (value: StockAccessValue) => void
}) {
  const t = useTranslations("team.stockRoles")
  // Relue à l'ouverture : un dépôt vient peut-être d'être déclaré.
  const warehouses =
    useWarehouses(CatalogStatus.active, { fresh: true }).data ?? []
  const options = [...stockRoles, null] as const
  const needsWarehouses =
    value.role !== null && value.role !== StockRole.generalManager

  return (
    <div className="space-y-4">
      <div
        role="radiogroup"
        aria-label={t("label")}
        className="grid gap-2 sm:grid-cols-2"
      >
        {options.map((role) => {
          const key = role ?? "NONE"
          const selected = value.role === role
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ ...value, role })}
              className={cn(
                "rounded-xl border p-3 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-foreground/20 hover:bg-muted/40"
              )}
            >
              <span className="block text-sm font-semibold">
                {t(`${key}.label`)}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t(`${key}.hint`)}
              </span>
            </button>
          )
        })}
      </div>
      {needsWarehouses && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">
            {t("warehouses")}
          </legend>
          {warehouses.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("noWarehouse")}</p>
          )}
          <ul className="grid gap-2 sm:grid-cols-2">
            {warehouses.map((warehouse) => {
              const checked = value.warehouseIds.includes(warehouse.id)
              return (
                <li key={warehouse.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-colors",
                      checked
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        onChange({
                          ...value,
                          warehouseIds: next
                            ? [...value.warehouseIds, warehouse.id]
                            : value.warehouseIds.filter(
                                (id) => id !== warehouse.id
                              ),
                        })
                      }
                    />
                    <span className="truncate">{warehouse.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}
    </div>
  )
}
