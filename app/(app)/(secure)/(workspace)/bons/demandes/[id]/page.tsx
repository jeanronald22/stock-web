import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { RequestScreen } from "@/components/requests/request-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("requests") }
}

export default async function RequestPage({
  params,
}: PageProps<"/bons/demandes/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <RequestScreen id={id} />
    </PageTransition>
  )
}
