import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { WarehouseScreen } from "@/components/warehouses/warehouse-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("warehouses") }
}

export default async function WarehousePage({
  params,
}: PageProps<"/depots/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <WarehouseScreen id={id} />
    </PageTransition>
  )
}
