"use client"

import { PlusIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { warehouseKindIcons } from "@/components/warehouses/warehouse-kind"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Warehouse } from "@/lib/api/stock"
import { Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

/** Dépôts où l'article est proposé : une case par dépôt actif. */
export function WarehouseChecklist({
  warehouses,
  value,
  onChange,
}: {
  warehouses: Warehouse[]
  value: string[]
  onChange: (ids: string[]) => void
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

  const selected = new Set(value)
  const visibleIds = warehouses.map((warehouse) => warehouse.id)
  const allSelected = visibleIds.every((id) => selected.has(id))
  // Un dépôt archivé déjà coché n'est pas affiché : « tout cocher / décocher » le laisse en place.
  const hidden = value.filter((id) => !visibleIds.includes(id))
  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    onChange([...next])
  }

  return (
    <div className="space-y-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {warehouses.map((warehouse) => {
          const Icon = warehouseKindIcons[warehouse.kind]
          const checked = selected.has(warehouse.id)
          return (
            <li key={warehouse.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                  checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                )}
              >
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
            </li>
          )
        })}
      </ul>
      {warehouses.length > 1 && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="px-0"
          onClick={() =>
            onChange(allSelected ? hidden : [...hidden, ...visibleIds])
          }
        >
          {allSelected ? t("items.form.selectNone") : t("items.form.selectAll")}
        </Button>
      )}
    </div>
  )
}
