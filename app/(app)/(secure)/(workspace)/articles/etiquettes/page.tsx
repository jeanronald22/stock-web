import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { LabelsScreen } from "@/components/labels/labels-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("labels") }
}

export default function LabelsPage() {
  return (
    // Articles ou bon de départ lus dans l'adresse.
    <Suspense>
      <LabelsScreen />
    </Suspense>
  )
}
