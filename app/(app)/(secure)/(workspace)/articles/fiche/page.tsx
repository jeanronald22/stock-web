import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ItemDetailScreen } from "@/components/items/item-detail-screen"
import { PageTransition } from "@/components/motion/page-transition"
import { RecordPage } from "@/components/records/record-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("items") }
}

export default function ItemPage() {
  return (
    <PageTransition>
      <RecordPage>
        <ItemDetailScreen />
      </RecordPage>
    </PageTransition>
  )
}
