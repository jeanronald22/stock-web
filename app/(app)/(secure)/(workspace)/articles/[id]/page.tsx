import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { ItemScreen } from "@/components/items/item-screen"
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
      <Suspense>
        <ItemScreen id={id} />
      </Suspense>
    </PageTransition>
  )
}
