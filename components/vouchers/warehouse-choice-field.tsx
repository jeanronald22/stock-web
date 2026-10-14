"use client"

import { MapPinIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"

import { buttonVariants } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { warehouseKindIcons } from "@/components/warehouses/warehouse-kind"
import type { Warehouse } from "@/lib/api/stock"
import { Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import type { VoucherFormValues } from "./voucher-form-schema"

/** Dépôt du bon : une grande carte par dépôt actif. */
export function WarehouseChoiceField({
  form,
  warehouses,
}: {
  form: UseFormReturn<VoucherFormValues>
  warehouses: Warehouse[]
}) {
  const t = useTranslations("vouchers.form")

  if (warehouses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-5">
        <p className="text-muted-foreground">{t("noWarehouse")}</p>
        <Link
          href={Routes.newWarehouse}
          className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
        >
          <PlusIcon />
          {t("createWarehouse")}
        </Link>
      </div>
    )
  }
  return (
    <Controller
      control={form.control}
      name="warehouseId"
      render={({ field, fieldState }) => (
        <>
          <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
            {warehouses.map((warehouse) => {
              const Icon = warehouseKindIcons[warehouse.kind]
              const selected = field.value === warehouse.id
              return (
                <button
                  key={warehouse.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => field.onChange(warehouse.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-foreground/20 hover:bg-muted/40"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-6 shrink-0",
                      selected ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {warehouse.name}
                    </span>
                    {warehouse.city && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPinIcon className="size-3.5" aria-hidden />
                        {warehouse.city}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
          <FieldError errors={[fieldState.error]} />
        </>
      )}
    />
  )
}
