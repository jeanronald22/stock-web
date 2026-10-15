import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { CustomerDetailScreen } from "@/components/customers/customer-detail-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("customers") }
}

export default async function Page({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params
  return (
    <PageTransition>
      <CustomerDetailScreen id={id} />
    </PageTransition>
  )
}
