import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { PageTransition } from "@/components/motion/page-transition"
import { VouchersScreen } from "@/components/vouchers/vouchers-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("vouchers") }
}

export default function Page() {
  return (
    // Filtres et page lus dans l'adresse.
    <Suspense>
      <PageTransition>
        <VouchersScreen />
      </PageTransition>
    </Suspense>
  )
}
