"use client"

import { TruckIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CatalogStatus } from "@/lib/api/stock"
import { useSupplier, useSuppliersPage } from "@/lib/api/supplier-queries"
import { cn } from "@/lib/utils"

import { FILTER_CONTROL } from "./filter-bar"

const ALL_SUPPLIERS = "all"
/** Une page de l'API au plus (PageParams.MAX_SIZE) : au-delà, la fiche fournisseur reste le chemin. */
const LISTED_SUPPLIERS = 100
const ACTIVE_SUPPLIERS = { status: CatalogStatus.active }

/** Filtre par fournisseur : articles qu'il livre (articles) ou ses réceptions (bons). */
export function SupplierFilter({
  value,
  onChange,
  className,
}: {
  value: string | undefined
  onChange: (supplierId: string | undefined) => void
  className?: string
}) {
  const t = useTranslations("catalog")
  const suppliers = useSuppliersPage(ACTIVE_SUPPLIERS, 0, LISTED_SUPPLIERS)
  // Fournisseur de l'adresse absent de la liste (archivé, au-delà de la page) : son nom est relu.
  const listed = suppliers.data?.items ?? []
  const missing = value && !listed.some((supplier) => supplier.id === value)
  const chosen = useSupplier(missing ? value : undefined)
  if (listed.length === 0 && !value) return null

  const items = [
    { value: ALL_SUPPLIERS, label: t("allSuppliers") },
    ...listed.map((supplier) => ({ value: supplier.id, label: supplier.name })),
    ...(missing && chosen.data
      ? [{ value: chosen.data.id, label: chosen.data.name }]
      : []),
  ]
  return (
    <Select
      items={items}
      value={value ?? ALL_SUPPLIERS}
      onValueChange={(next) =>
        onChange(!next || next === ALL_SUPPLIERS ? undefined : next)
      }
    >
      <SelectTrigger
        className={cn(
          FILTER_CONTROL,
          value && "border-primary/50 bg-primary/5",
          className
        )}
        aria-label={t("supplierFilter")}
      >
        <TruckIcon className="size-5 text-muted-foreground" aria-hidden />
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
