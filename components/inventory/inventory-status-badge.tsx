"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { InventoryStatus } from "@/lib/api/inventories"

const VARIANTS = {
  [InventoryStatus.open]: "warning",
  [InventoryStatus.closed]: "success",
  [InventoryStatus.cancelled]: "secondary",
} as const satisfies Record<
  InventoryStatus,
  "warning" | "success" | "secondary"
>

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  const t = useTranslations("inventory.status")
  return <Badge variant={VARIANTS[status]}>{t(status)}</Badge>
}
