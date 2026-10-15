import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { RequestsScreen } from "@/components/requests/requests-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("requests") }
}

export default function RequestsPage() {
  return (
    <PageTransition>
      <RequestsScreen />
    </PageTransition>
  )
}
