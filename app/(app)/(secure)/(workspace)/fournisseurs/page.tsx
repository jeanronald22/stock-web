import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { PageTransition } from "@/components/motion/page-transition"
import { SuppliersScreen } from "@/components/suppliers/suppliers-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("suppliers") }
}

export default function SuppliersPage() {
  return (
    <PageTransition>
      {/* Recherche, statut et page lus dans l'adresse. */}
      <Suspense>
        <SuppliersScreen />
      </Suspense>
    </PageTransition>
  )
}
