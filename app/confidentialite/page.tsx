import type { Metadata } from "next"
import { getLocale } from "next-intl/server"

import { LegalDocument } from "@/components/legal/legal-document"
import { isAppLocale, type AppLocale } from "@/i18n/locales"
import { PrivacyPolicyRelease, privacyPolicy } from "@/lib/legal/privacy-policy"
import { PublicQueryParams, Routes } from "@/lib/routes"

type PrivacyPageProps = PageProps<typeof Routes.privacy>

/** La langue du lien (écrans de connexion) l'emporte sur celle de l'application. */
async function resolveLocale(
  searchParams: PrivacyPageProps["searchParams"]
): Promise<AppLocale> {
  const requested = (await searchParams)[PublicQueryParams.lang]
  if (typeof requested === "string" && isAppLocale(requested)) return requested
  return (await getLocale()) as AppLocale
}

export async function generateMetadata({
  searchParams,
}: PrivacyPageProps): Promise<Metadata> {
  const content = privacyPolicy(await resolveLocale(searchParams))
  return { title: content.title, description: content.summary }
}

export default async function PrivacyPage({ searchParams }: PrivacyPageProps) {
  const locale = await resolveLocale(searchParams)
  return (
    <LegalDocument
      content={privacyPolicy(locale)}
      locale={locale}
      version={PrivacyPolicyRelease.version}
      updatedOn={PrivacyPolicyRelease.updatedOn}
      path={Routes.privacy}
    />
  )
}
