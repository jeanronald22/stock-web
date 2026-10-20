import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { CompanySettings } from "@/components/settings/company-settings"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("settingsCompany") }
}

export default function CompanySettingsPage() {
  return (
    <PageTransition>
      <CompanySettings />
    </PageTransition>
  )
}
