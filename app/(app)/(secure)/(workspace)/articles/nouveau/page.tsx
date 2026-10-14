import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { NewItemScreen } from "@/components/items/item-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("newItem") }
}

export default function NewItemPage() {
  return (
    <PageTransition>
      {/* Le dépôt proposé d'office est lu dans l'adresse. */}
      <Suspense>
        <NewItemScreen />
      </Suspense>
    </PageTransition>
  )
}
