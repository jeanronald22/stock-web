import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { OrganizationPicker } from "@/components/organizations/organization-picker"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("organizations") }
}

export default function OrganizationsPage() {
  return <OrganizationPicker />
}
