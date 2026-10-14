import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { InventoryScreen } from "@/components/inventory/inventory-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("inventory") }
}

export default async function InventoryPage({
  params,
}: PageProps<"/stock/inventaires/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <InventoryScreen id={id} />
    </PageTransition>
  )
}
