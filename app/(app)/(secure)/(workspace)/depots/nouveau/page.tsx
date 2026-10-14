import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { NewWarehouseScreen } from "@/components/warehouses/warehouse-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("newWarehouse") }
}

export default function NewWarehousePage() {
  return (
    <PageTransition>
      <NewWarehouseScreen />
    </PageTransition>
  )
}
