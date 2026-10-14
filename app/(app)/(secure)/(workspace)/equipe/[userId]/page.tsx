import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageTransition } from "@/components/motion/page-transition"
import { MemberScreen } from "@/components/team/member-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("member") }
}

export default async function MemberPage({
  params,
}: PageProps<"/equipe/[userId]">) {
  const { userId } = await params
  return (
    <PageTransition>
      <MemberScreen userId={userId} />
    </PageTransition>
  )
}
