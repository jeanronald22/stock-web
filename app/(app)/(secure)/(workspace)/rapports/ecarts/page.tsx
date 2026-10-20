import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { DiscrepancyReportScreen } from "@/components/reports/discrepancy-report"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("reportsDiscrepancies") }
}

export default function DiscrepancyReportPage() {
  return (
    // Période, dépôts et article lus dans l'adresse.
    <Suspense>
      <DiscrepancyReportScreen />
    </Suspense>
  )
}
