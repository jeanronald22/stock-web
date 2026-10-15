import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ImportScreen } from "@/components/import/import-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("importItems") }
}

export default function ImportItemsPage() {
  return <ImportScreen />
}
