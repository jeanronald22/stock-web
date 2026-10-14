import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { TransferReceiptScreen } from "@/components/vouchers/transfer-receipt-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("transferReceipt") }
}

export default async function TransferReceiptPage({
  params,
}: PageProps<"/bons/[id]/receptionner">) {
  const { id } = await params
  return (
    <PageTransition>
      <TransferReceiptScreen id={id} />
    </PageTransition>
  )
}
