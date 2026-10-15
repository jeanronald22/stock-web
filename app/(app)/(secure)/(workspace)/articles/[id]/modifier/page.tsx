import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ItemEditScreen } from "@/components/items/item-edit-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("editItem") }
}

export default async function ItemEditPage({
  params,
}: PageProps<"/articles/[id]/modifier">) {
  const { id } = await params
  return (
    <PageTransition>
      <ItemEditScreen id={id} />
    </PageTransition>
  )
}
