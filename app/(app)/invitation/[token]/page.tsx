import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { InvitationScreen } from "@/components/invitation/invitation-screen"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("invitation") }
}

/** Ouverte depuis l'e-mail, connecté ou non : la page guide vers la connexion si besoin. */
export default async function InvitationPage({
  params,
}: PageProps<"/invitation/[token]">) {
  const { token } = await params
  return <InvitationScreen token={decodeURIComponent(token)} />
}
