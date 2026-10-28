import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { WarehouseDetailScreen } from "@/components/warehouses/warehouse-detail-screen"
import { PageTransition } from "@/components/motion/page-transition"
import { RecordPage } from "@/components/records/record-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("warehouses") }
}

export default function WarehousePage() {
  return (
    <PageTransition>
      <RecordPage>
        <WarehouseDetailScreen />
      </RecordPage>
    </PageTransition>
  )
}
