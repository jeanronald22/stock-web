import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { VoucherType } from "@/lib/api/vouchers"
import { VoucherWizard } from "@/components/vouchers/voucher-wizard"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("newReceipt") }
}

export default function Page() {
  return (
    // Le dépôt proposé est lu dans l’adresse.
    <Suspense>
      <VoucherWizard type={VoucherType.receipt} />
    </Suspense>
  )
}
