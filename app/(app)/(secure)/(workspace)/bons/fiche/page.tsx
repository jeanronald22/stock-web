import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { VoucherScreen } from "@/components/vouchers/voucher-screen"
import { PageTransition } from "@/components/motion/page-transition"
import { RecordPage } from "@/components/records/record-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("vouchers") }
}

export default function VoucherPage() {
  return (
    <PageTransition>
      <RecordPage>
        <VoucherScreen />
      </RecordPage>
    </PageTransition>
  )
}
