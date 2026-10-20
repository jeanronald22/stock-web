import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { AlertSettings } from "@/components/settings/alert-settings"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("settingsAlerts") }
}

export default function AlertSettingsPage() {
  return (
    <PageTransition>
      <AlertSettings />
    </PageTransition>
  )
}
