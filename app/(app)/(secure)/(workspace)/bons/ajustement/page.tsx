import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { VoucherEntry } from "@/components/vouchers/voucher-entry"
import { VoucherType } from "@/lib/api/vouchers"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("newAdjustment") }
}

export default function Page() {
  return (
    <PageTransition>
      <VoucherEntry type={VoucherType.adjustment} />
    </PageTransition>
  )
}
