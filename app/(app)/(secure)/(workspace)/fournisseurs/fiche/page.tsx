import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SupplierDetailScreen } from "@/components/suppliers/supplier-detail-screen"
import { PageTransition } from "@/components/motion/page-transition"
import { RecordPage } from "@/components/records/record-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("suppliers") }
}

export default function SupplierPage() {
  return (
    <PageTransition>
      <RecordPage>
        <SupplierDetailScreen />
      </RecordPage>
    </PageTransition>
  )
}
