"use client"

import { WarehouseIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWarehouses } from "@/lib/api/stock-queries"
import { cn } from "@/lib/utils"

/** Valeur « Tous les dépôts » : aucun identifiant de dépôt ne peut la prendre. */
const ALL_WAREHOUSES = "all"

/** Filtre par dépôt actif, commun aux articles, au stock et aux bons. */
export function WarehouseFilter({
  value,
  onChange,
  className,
  ...props
}: {
  value: string | undefined
  onChange: (warehouseId: string | undefined) => void
  className?: string
} & Record<`data-${string}`, string>) {
  const t = useTranslations("catalog")
  const warehouses = useWarehouses()
  const options = [
    { value: ALL_WAREHOUSES, label: t("allWarehouses") },
    ...(warehouses.data ?? []).map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
    })),
  ]
  return (
    <Select
      items={options}
      value={value ?? ALL_WAREHOUSES}
      onValueChange={(next) =>
        onChange(!next || next === ALL_WAREHOUSES ? undefined : next)
      }
    >
      <SelectTrigger
        className={cn("w-full sm:w-64", className)}
        aria-label={t("allWarehouses")}
        {...props}
      >
        <WarehouseIcon className="size-5 text-muted-foreground" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
