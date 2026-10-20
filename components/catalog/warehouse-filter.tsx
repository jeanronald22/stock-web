"use client"

import { ChevronDownIcon, WarehouseIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWarehouses } from "@/lib/api/stock-queries"
import { cn } from "@/lib/utils"

import { FILTER_CONTROL } from "./filter-bar"

/** Filtre par dépôts actifs, commun aux articles, au stock et aux bons : aucun coché, tous. */
export function WarehouseFilter({
  value,
  onChange,
  className,
  ...props
}: {
  value: string[]
  onChange: (warehouseIds: string[]) => void
  className?: string
} & Record<`data-${string}`, string>) {
  const t = useTranslations("catalog")
  const warehouses = useWarehouses().data ?? []
  const selected = new Set(value)
  const chosen = warehouses.filter((warehouse) => selected.has(warehouse.id))
  const label =
    value.length === 0
      ? t("allWarehouses")
      : chosen.length === 1 && value.length === 1
        ? chosen[0].name
        : t("warehouseCount", { count: value.length })

  const toggle = (id: string, checked: boolean) =>
    onChange(
      checked ? [...value, id] : value.filter((candidate) => candidate !== id)
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className={cn(
              FILTER_CONTROL,
              "h-11 justify-start px-3.5 text-base font-normal",
              value.length > 0 && "border-primary/50 bg-primary/5",
              className
            )}
            aria-label={t("warehouseFilter")}
            {...props}
          />
        }
      >
        <WarehouseIcon className="size-5 text-muted-foreground" aria-hidden />
        <span className="truncate">{label}</span>
        <ChevronDownIcon
          className="ml-auto size-4 text-muted-foreground"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem
          disabled={value.length === 0}
          onClick={() => onChange([])}
        >
          {t("allWarehouses")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {warehouses.map((warehouse) => (
          <DropdownMenuCheckboxItem
            key={warehouse.id}
            checked={selected.has(warehouse.id)}
            onCheckedChange={(checked) => toggle(warehouse.id, checked)}
          >
            <span className="truncate">{warehouse.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
