import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { VoucherDocument } from "@/components/vouchers/voucher-document"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("printVoucher") }
}

/** Plein écran, sans barre latérale : seul le document s'imprime. */
export default async function VoucherPrintPage({
  params,
}: PageProps<"/bons/[id]/imprimer">) {
  const { id } = await params
  return <VoucherDocument id={id} />
}
