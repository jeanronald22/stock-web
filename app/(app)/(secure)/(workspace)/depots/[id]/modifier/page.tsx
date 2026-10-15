import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { WarehouseEditScreen } from "@/components/warehouses/warehouse-edit-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("editWarehouse") }
}

export default async function Page({
  params,
}: PageProps<"/depots/[id]/modifier">) {
  const { id } = await params
  return (
    <PageTransition>
      <WarehouseEditScreen id={id} />
    </PageTransition>
  )
}
