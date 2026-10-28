import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { TransferReceiptScreen } from "@/components/vouchers/transfer-receipt-screen"
import { PageTransition } from "@/components/motion/page-transition"
import { RecordPage } from "@/components/records/record-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("transferReceipt") }
}

export default function TransferReceiptPage() {
  return (
    <PageTransition>
      <RecordPage>
        <TransferReceiptScreen />
      </RecordPage>
    </PageTransition>
  )
}
