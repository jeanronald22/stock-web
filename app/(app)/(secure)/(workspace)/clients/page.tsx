import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { CustomersScreen } from "@/components/customers/customers-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("customers") }
}

export default function CustomersPage() {
  return (
    <PageTransition>
      {/* Recherche, genre, statut et page lus dans l'adresse. */}
      <Suspense>
        <CustomersScreen />
      </Suspense>
    </PageTransition>
  )
}
