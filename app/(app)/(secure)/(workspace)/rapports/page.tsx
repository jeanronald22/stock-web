import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { MovementsReportScreen } from "@/components/reports/movements-report"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("reports") }
}

export default function ReportsPage() {
  return (
    // Période et dépôts lus dans l'adresse.
    <Suspense>
      <MovementsReportScreen />
    </Suspense>
  )
}
