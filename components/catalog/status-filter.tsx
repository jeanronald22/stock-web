"use client"

import { ArchiveIcon, CircleCheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { catalogStatuses, CatalogStatus } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

/** Fiches actives ou archivées : même filtre pour les articles et les dépôts. */
export function StatusFilter({
  value,
  onChange,
  className,
}: {
  value: CatalogStatus
  onChange: (status: CatalogStatus) => void
  className?: string
}) {
  const t = useTranslations("catalog.status")
  const items = catalogStatuses.map((status) => ({
    value: status,
    label: t(status),
  }))
  const Icon = value === CatalogStatus.archived ? ArchiveIcon : CircleCheckIcon

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => next && onChange(next as CatalogStatus)}
    >
      <SelectTrigger
        className={cn("w-full sm:w-44", className)}
        aria-label={t("label")}
      >
        <Icon className="size-5 text-muted-foreground" aria-hidden />
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
