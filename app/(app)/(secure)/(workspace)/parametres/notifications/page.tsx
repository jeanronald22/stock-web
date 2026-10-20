import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { NotificationSettings } from "@/components/notifications/notification-settings"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("notifications") }
}

export default function NotificationSettingsPage() {
  return (
    <PageTransition>
      <NotificationSettings />
    </PageTransition>
  )
}
