import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { ItemsScreen } from "@/components/items/items-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("items") }
}

export default function ItemsPage() {
  return (
    <PageTransition>
      {/* Le filtre par dépôt est lu dans l'adresse. */}
      <Suspense>
        <ItemsScreen />
      </Suspense>
    </PageTransition>
  )
}
