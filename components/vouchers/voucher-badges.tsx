"use client"

import {
  ArrowDownToLineIcon,
  ArrowRightLeftIcon,
  ArrowUpFromLineIcon,
  ClipboardCheckIcon,
  PackageXIcon,
  Redo2Icon,
  Undo2Icon,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { TransferState, VoucherType } from "@/lib/api/vouchers"

const TYPE_ICONS: Record<VoucherType, LucideIcon> = {
  [VoucherType.receipt]: ArrowDownToLineIcon,
  [VoucherType.issue]: ArrowUpFromLineIcon,
  [VoucherType.transferOut]: ArrowRightLeftIcon,
  [VoucherType.transferIn]: ArrowRightLeftIcon,
  [VoucherType.damage]: PackageXIcon,
  [VoucherType.adjustment]: ClipboardCheckIcon,
  [VoucherType.customerReturn]: Undo2Icon,
  [VoucherType.supplierReturn]: Redo2Icon,
}

const TYPE_BADGES: Record<
  VoucherType,
  "success" | "secondary" | "info" | "danger" | "warning"
> = {
  [VoucherType.receipt]: "success",
  [VoucherType.issue]: "secondary",
  [VoucherType.transferOut]: "info",
  [VoucherType.transferIn]: "info",
  [VoucherType.damage]: "danger",
  [VoucherType.adjustment]: "warning",
  [VoucherType.customerReturn]: "success",
  [VoucherType.supplierReturn]: "secondary",
}

export function VoucherTypeBadge({ type }: { type: VoucherType }) {
  const t = useTranslations("vouchers.types")
  const Icon = TYPE_ICONS[type]
  return (
    <Badge variant={TYPE_BADGES[type]} className="gap-1">
      <Icon className="size-3" aria-hidden />
      {t(type)}
    </Badge>
  )
}

/** Reçu autrement qu'attendu : à vérifier, voire à réclamer au fournisseur (D28). */
export function DiscrepancyBadge() {
  const t = useTranslations("vouchers")
  return <Badge variant="warning">{t("discrepancy")}</Badge>
}

/** « En transit » tant que l'envoi n'est pas réceptionné, puis « Reçu ». */
export function TransferStateBadge({ state }: { state: TransferState }) {
  const t = useTranslations("vouchers.transferState")
  return (
    <Badge variant={state === TransferState.inTransit ? "warning" : "success"}>
      {t(state)}
    </Badge>
  )
}
