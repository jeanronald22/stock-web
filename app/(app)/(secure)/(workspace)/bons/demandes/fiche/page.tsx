import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { RequestScreen } from "@/components/requests/request-screen"
import { PageTransition } from "@/components/motion/page-transition"
import { RecordPage } from "@/components/records/record-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("requests") }
}

export default function RequestPage() {
  return (
    <PageTransition>
      <RecordPage>
        <RequestScreen />
      </RecordPage>
    </PageTransition>
  )
}
