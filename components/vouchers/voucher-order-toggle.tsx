"use client"

import { ArrowDownWideNarrowIcon, ArrowUpNarrowWideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { VoucherOrder } from "@/lib/api/vouchers"

/** Ordre des bons par date : les plus récents d'abord, ou les plus anciens. */
export function VoucherOrderToggle({
  order,
  onChange,
}: {
  order: VoucherOrder
  onChange: (order: VoucherOrder) => void
}) {
  const t = useTranslations("vouchers.period")
  const oldestFirst = order === VoucherOrder.oldestFirst
  const Icon = oldestFirst ? ArrowUpNarrowWideIcon : ArrowDownWideNarrowIcon
  const label = oldestFirst ? t("oldestFirst") : t("newestFirst")
  return (
    <Button
      variant="outline"
      className="h-11 px-3 font-normal sm:h-9 sm:text-sm"
      aria-label={label}
      aria-pressed={oldestFirst}
      onClick={() =>
        onChange(
          oldestFirst ? VoucherOrder.newestFirst : VoucherOrder.oldestFirst
        )
      }
    >
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      <span className="hidden lg:inline">{label}</span>
    </Button>
  )
}
