import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { InvitationWizard } from "@/components/team/invitation-wizard"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("newInvitation") }
}

export default function NewInvitationPage() {
  return <InvitationWizard />
}
