import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { CustomerDetailScreen } from "@/components/customers/customer-detail-screen"
import { PageTransition } from "@/components/motion/page-transition"
import { RecordPage } from "@/components/records/record-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("customers") }
}

export default function CustomerPage() {
  return (
    <PageTransition>
      <RecordPage>
        <CustomerDetailScreen />
      </RecordPage>
    </PageTransition>
  )
}
