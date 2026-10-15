"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { RequestStatus } from "@/lib/api/voucher-requests"

const VARIANTS = {
  [RequestStatus.pending]: "warning",
  [RequestStatus.approved]: "success",
  [RequestStatus.rejected]: "danger",
  [RequestStatus.withdrawn]: "secondary",
} as const satisfies Record<
  RequestStatus,
  "warning" | "success" | "danger" | "secondary"
>

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const t = useTranslations("requests.status")
  return <Badge variant={VARIANTS[status]}>{t(status)}</Badge>
}
