import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { CustomerScreen } from "@/components/customers/customer-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("customers") }
}

export default async function CustomerPage({
  params,
}: PageProps<"/clients/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <CustomerScreen id={id} />
    </PageTransition>
  )
}
