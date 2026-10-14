import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"

import { OrganizationPicker } from "@/components/organizations/organization-picker"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("organizations") }
}

export default function OrganizationsPage() {
  return (
    <PageTransition>
      <OrganizationPicker />
    </PageTransition>
  )
}
