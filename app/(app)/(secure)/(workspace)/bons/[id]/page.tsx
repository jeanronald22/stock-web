import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { VoucherScreen } from "@/components/vouchers/voucher-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("vouchers") }
}

export default async function VoucherPage({ params }: PageProps<"/bons/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <VoucherScreen id={id} />
    </PageTransition>
  )
}
