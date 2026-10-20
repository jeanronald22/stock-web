import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { ProfileScreen } from "@/components/profile/profile-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("profile") }
}

export default function ProfilePage() {
  return (
    <PageTransition>
      <ProfileScreen />
    </PageTransition>
  )
}
