import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SignIn } from "./sign-in"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("signIn") }
}

export default function SignInPage() {
  return <SignIn />
}
