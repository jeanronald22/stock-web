import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { TeamScreen } from "@/components/team/team-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("team") }
}

export default function TeamPage() {
  return (
    <PageTransition>
      <TeamScreen />
    </PageTransition>
  )
}
