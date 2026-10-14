import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { SupplierScreen } from "@/components/suppliers/supplier-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("suppliers") }
}

export default async function SupplierPage({
  params,
}: PageProps<"/fournisseurs/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <SupplierScreen id={id} />
    </PageTransition>
  )
}
