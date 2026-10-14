import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { PageTransition } from "@/components/motion/page-transition"
import { VoucherEntry } from "@/components/vouchers/voucher-entry"
import { VoucherType } from "@/lib/api/vouchers"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("newCustomerReturn") }
}

export default function Page() {
  return (
    <PageTransition>
      {/* Retour libre, ou depuis un bon : son identifiant est lu dans l'adresse. */}
      <Suspense>
        <VoucherEntry type={VoucherType.customerReturn} />
      </Suspense>
    </PageTransition>
  )
}
