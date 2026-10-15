import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SupplierDetailScreen } from "@/components/suppliers/supplier-detail-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("suppliers") }
}

export default async function Page({
  params,
}: PageProps<"/fournisseurs/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <SupplierDetailScreen id={id} />
    </PageTransition>
  )
}
