import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { CustomerEditScreen } from "@/components/customers/customer-edit-screen"
import { PageTransition } from "@/components/motion/page-transition"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("editCustomer") }
}

export default async function Page({
  params,
}: PageProps<"/clients/[id]/modifier">) {
  const { id } = await params
  return (
    <PageTransition>
      <CustomerEditScreen id={id} />
    </PageTransition>
  )
}
