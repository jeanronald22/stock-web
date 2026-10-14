"use client"

import { ArrowDownWideNarrowIcon, ArrowUpNarrowWideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { VoucherOrder } from "@/lib/api/vouchers"
import { cn } from "@/lib/utils"

/**
 * Période des bons (jours inclus, au fuseau des dépôts) et ordre par date. Une borne laissée vide
 * n'en est pas une ; « au » ne peut précéder « du ».
 */
export function PeriodFilter({
  from,
  to,
  order,
  onPeriodChange,
  onOrderChange,
}: {
  from: string | undefined
  to: string | undefined
  order: VoucherOrder
  onPeriodChange: (from: string | undefined, to: string | undefined) => void
  onOrderChange: (order: VoucherOrder) => void
}) {
  const t = useTranslations("vouchers.period")
  const oldestFirst = order === VoucherOrder.oldestFirst
  const OrderIcon = oldestFirst
    ? ArrowUpNarrowWideIcon
    : ArrowDownWideNarrowIcon

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <InputGroup className={cn("sm:w-48", from && "border-primary/50")}>
          <InputGroupAddon>
            <InputGroupText>{t("from")}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="date"
            value={from ?? ""}
            max={to}
            aria-label={t("fromLabel")}
            onChange={(event) =>
              onPeriodChange(event.target.value || undefined, to)
            }
          />
        </InputGroup>
        <InputGroup className={cn("sm:w-48", to && "border-primary/50")}>
          <InputGroupAddon>
            <InputGroupText>{t("to")}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="date"
            value={to ?? ""}
            min={from}
            aria-label={t("toLabel")}
            onChange={(event) =>
              onPeriodChange(from, event.target.value || undefined)
            }
          />
        </InputGroup>
      </div>
      <Button
        variant="outline"
        size="lg"
        className="h-11 justify-start font-normal"
        aria-pressed={oldestFirst}
        onClick={() =>
          onOrderChange(
            oldestFirst ? VoucherOrder.newestFirst : VoucherOrder.oldestFirst
          )
        }
      >
        <OrderIcon className="size-5 text-muted-foreground" aria-hidden />
        {oldestFirst ? t("oldestFirst") : t("newestFirst")}
      </Button>
    </div>
  )
}
