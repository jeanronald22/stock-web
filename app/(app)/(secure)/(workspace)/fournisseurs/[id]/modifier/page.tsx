import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SupplierEditScreen } from "@/components/suppliers/supplier-edit-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("editSupplier") }
}

export default async function Page({
  params,
}: PageProps<"/fournisseurs/[id]/modifier">) {
  const { id } = await params
  return (
    <PageTransition>
      <SupplierEditScreen id={id} />
    </PageTransition>
  )
}
