"use client"

import { BellIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StockAlertParam } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { FILTER_CONTROL } from "./filter-bar"

/** Valeur « Tous les articles » : distincte de toute valeur d'alerte. */
const ALL_LEVELS = "all"

/** Articles en alerte (seuil atteint ou rupture), d'après les seuils de chaque dépôt. */
export function StockAlertFilter({
  value,
  onChange,
  className,
}: {
  value: StockAlertParam | undefined
  onChange: (alert: StockAlertParam | undefined) => void
  className?: string
}) {
  const t = useTranslations("catalog.stockAlert")
  const items = [
    { value: ALL_LEVELS, label: t("all") },
    ...Object.entries(StockAlertParam).map(([key, alert]) => ({
      value: alert,
      label: t(key as keyof typeof StockAlertParam),
    })),
  ]
  return (
    <Select
      items={items}
      value={value ?? ALL_LEVELS}
      onValueChange={(next) =>
        onChange(Object.values(StockAlertParam).find((alert) => alert === next))
      }
    >
      <SelectTrigger
        className={cn(
          FILTER_CONTROL,
          value && "border-primary/50 bg-primary/5",
          className
        )}
        aria-label={t("label")}
      >
        <BellIcon className="size-5 text-muted-foreground" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
