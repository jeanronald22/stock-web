import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { PageTransition } from "@/components/motion/page-transition"
import { StockScreen } from "@/components/stock/stock-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("stock") }
}

export default function Page() {
  return (
    // Filtres et page lus dans l'adresse.
    <Suspense>
      <PageTransition>
        <StockScreen />
      </PageTransition>
    </Suspense>
  )
}
