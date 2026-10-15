import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { WarehouseDetailScreen } from "@/components/warehouses/warehouse-detail-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("warehouses") }
}

export default async function Page({ params }: PageProps<"/depots/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <WarehouseDetailScreen id={id} />
    </PageTransition>
  )
}
