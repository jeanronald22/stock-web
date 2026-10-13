import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { Welcome } from "@/components/onboarding/welcome"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("welcome") }
}

export default function WelcomePage() {
  return <Welcome />
}
