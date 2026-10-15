import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ItemDetailScreen } from "@/components/items/item-detail-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("items") }
}

export default async function ItemPage({
  params,
}: PageProps<"/articles/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <ItemDetailScreen id={id} />
    </PageTransition>
  )
}
