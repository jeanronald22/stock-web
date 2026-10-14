import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { PageTransition } from "@/components/motion/page-transition"
import { WarehousesScreen } from "@/components/warehouses/warehouses-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("warehouses") }
}

export default function WarehousesPage() {
  return (
    <PageTransition>
      {/* Le filtre de statut est lu dans l'adresse. */}
      <Suspense>
        <WarehousesScreen />
      </Suspense>
    </PageTransition>
  )
}
