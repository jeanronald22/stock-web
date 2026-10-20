import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { DamageReportScreen } from "@/components/reports/damage-report"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("reportsDamage") }
}

export default function DamageReportPage() {
  return (
    // Période, dépôts et article lus dans l'adresse.
    <Suspense>
      <DamageReportScreen />
    </Suspense>
  )
}
