import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { ItemWizard } from "@/components/items/item-wizard"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("newItem") }
}

export default function NewItemPage() {
  return (
    // Le dépôt proposé d'office est lu dans l'adresse.
    <Suspense>
      <ItemWizard />
    </Suspense>
  )
}
