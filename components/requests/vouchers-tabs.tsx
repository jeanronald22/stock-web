"use client"

import { ClipboardClockIcon, ReceiptTextIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { SectionTabs } from "@/components/workspace/section-tabs"
import {
  usePendingRequestCount,
  useStockSettings,
} from "@/lib/api/request-queries"
import { Routes } from "@/lib/routes"

/**
 * « Bons » et « Demandes » (D33) : le second onglet n'apparaît que si l'entreprise fait valider ses
 * sorties, ou s'il reste des demandes en attente.
 */
export function VouchersTabs() {
  const t = useTranslations("requests")
  const settings = useStockSettings()
  const pending = usePendingRequestCount().data?.count ?? 0
  if (!settings.data?.issueApproval && pending === 0) return null
  return (
    <SectionTabs
      label={t("tabs.label")}
      tabs={[
        {
          href: Routes.vouchers,
          icon: ReceiptTextIcon,
          label: t("tabs.vouchers"),
          except: [Routes.requests],
        },
        {
          href: Routes.requests,
          icon: ClipboardClockIcon,
          label: t("tabs.requests"),
          count: pending,
        },
      ]}
    />
  )
}
