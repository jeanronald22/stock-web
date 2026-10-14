"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useWatch, type UseFormReturn } from "react-hook-form"

import { useQuantityLabel } from "@/components/items/describe"
import type { Warehouse } from "@/lib/api/stock"
import { VoucherType } from "@/lib/api/vouchers"
import { parseQuantity } from "@/lib/forms/quantity"

import {
  BASE_UNIT_CHOICE,
  baseQuantity,
  type VoucherFormValues,
} from "./voucher-form-schema"

/** Récapitulatif avant validation : ce que la personne s'apprête à signer. */
export function VoucherSummary({
  form,
  type,
  warehouses,
}: {
  form: UseFormReturn<VoucherFormValues>
  type: VoucherType
  warehouses: Warehouse[]
}) {
  const t = useTranslations()
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const values = useWatch({ control: form.control }) as VoucherFormValues
  const warehouse = warehouses.find(
    (candidate) => candidate.id === values.warehouseId
  )

  return (
    <div className="space-y-5">
      <dl className="grid gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">
            {t("vouchers.detail.warehouse")}
          </dt>
          <dd className="font-semibold">{warehouse?.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("vouchers.detail.date")}</dt>
          <dd className="font-semibold">
            {format.dateTime(new Date(`${values.occurredOn}T12:00:00`), {
              dateStyle: "long",
            })}
          </dd>
        </div>
        {values.counterparty && (
          <div>
            <dt className="text-muted-foreground">
              {type === VoucherType.receipt
                ? t("vouchers.detail.supplier")
                : t("vouchers.detail.customer")}
            </dt>
            <dd className="font-semibold">{values.counterparty}</dd>
          </div>
        )}
        {values.documentReference && (
          <div>
            <dt className="text-muted-foreground">
              {t("vouchers.detail.reference")}
            </dt>
            <dd className="font-semibold">{values.documentReference}</dd>
          </div>
        )}
      </dl>
      <ul className="divide-y rounded-xl border">
        {values.lines.map((line) => {
          const entered = parseQuantity(line.quantity) ?? 0
          const base = baseQuantity(line.item, entered, line.unit)
          return (
            <li
              key={line.key}
              className="flex items-start justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{line.item.name}</p>
                {line.item.batchTracking && (
                  <p className="text-sm text-muted-foreground">
                    {t("vouchers.detail.batch")} {line.batch}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold tabular-nums">
                  {type === VoucherType.receipt ? "+" : "−"}{" "}
                  {quantityLabel(line.item.baseUnit, base)}
                </p>
                {line.unit !== BASE_UNIT_CHOICE && (
                  <p className="text-sm text-muted-foreground">
                    {format.number(entered)} {line.unit}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
