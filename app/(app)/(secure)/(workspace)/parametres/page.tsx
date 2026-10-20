import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SettingsIndex } from "@/components/settings/settings-shell"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("settings") }
}

export default function SettingsPage() {
  return <SettingsIndex />
}
