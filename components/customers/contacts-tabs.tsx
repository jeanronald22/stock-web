"use client"

import { ContactRoundIcon, TruckIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { SectionTabs } from "@/components/workspace/section-tabs"
import { Routes } from "@/lib/routes"

/** « Contacts » (D30) : fournisseurs et clients, deux onglets d'une même entrée de menu. */
export function ContactsTabs() {
  const t = useTranslations("contacts")
  return (
    <SectionTabs
      label={t("title")}
      tabs={[
        { href: Routes.suppliers, icon: TruckIcon, label: t("suppliers") },
        {
          href: Routes.customers,
          icon: ContactRoundIcon,
          label: t("customers"),
        },
      ]}
    />
  )
}
