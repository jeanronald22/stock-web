import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"

import { Dashboard } from "@/components/dashboard/dashboard"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("dashboard") }
}

export default function DashboardPage() {
  return (
    <PageTransition>
      <Dashboard />
    </PageTransition>
  )
}
