"use client"

import {
  BellIcon,
  Building2Icon,
  ListChecksIcon,
  LockKeyholeIcon,
  SirenIcon,
  type LucideIcon,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { SectionTabs } from "@/components/workspace/section-tabs"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useWorkspace } from "@/components/workspace/workspace-context"
import { MembershipRole } from "@/lib/api/platform"
import { StockRole } from "@/lib/api/stock"
import { Routes } from "@/lib/routes"

type SettingsTab = {
  href: string
  icon: LucideIcon
  label: "company" | "alerts" | "rules" | "notifications"
}

/** Dans l'ordre des onglets : le premier ouvert est celui que /parametres affiche. */
const SETTINGS_TABS: readonly SettingsTab[] = [
  { href: Routes.settingsCompany, icon: Building2Icon, label: "company" },
  { href: Routes.settingsAlerts, icon: SirenIcon, label: "alerts" },
  { href: Routes.settingsRules, icon: ListChecksIcon, label: "rules" },
  { href: Routes.notificationSettings, icon: BellIcon, label: "notifications" },
]

/**
 * Onglets ouverts à la personne, mêmes droits que l'API : la fiche, le KYB et les règles de travail
 * au propriétaire et aux administrateurs ; les alertes aussi aux gérants (D44) ; ses notifications
 * à chacun (D26).
 */
function useSettingsTabs(): readonly SettingsTab[] {
  const { organization } = useWorkspace()
  const { access } = useStockAccess()
  const managesTeam = organization.role !== MembershipRole.member
  const setsAlerts = managesTeam || access.role === StockRole.generalManager
  return SETTINGS_TABS.filter((tab) => {
    switch (tab.label) {
      case "company":
      case "rules":
        return managesTeam
      case "alerts":
        return setsAlerts
      case "notifications":
        return true
    }
  })
}

/** Un onglet couvre son adresse et ses sous-écrans. */
const covers = (tab: SettingsTab, pathname: string) =>
  pathname === tab.href || pathname.startsWith(`${tab.href}/`)

/**
 * « Paramètres » (D45) : ce que l'entreprise règle une fois et que ses écrans appliquent, rangé en
 * onglets. Un onglet hors des droits de la personne n'est ni proposé ni affiché.
 */
export function SettingsShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("settings")
  const pathname = usePathname()
  const tabs = useSettingsTabs()
  const known = SETTINGS_TABS.some((tab) => covers(tab, pathname))
  const allowed = tabs.some((tab) => covers(tab, pathname))

  return (
    <PageBody>
      <PageHeader title={t("title")} description={t("description")} />
      {tabs.length > 1 && (
        <SectionTabs
          label={t("title")}
          tabs={tabs.map((tab) => ({
            href: tab.href,
            icon: tab.icon,
            label: t(`tabs.${tab.label}`),
          }))}
        />
      )}
      <div className="mt-8">
        {known && !allowed ? (
          <EmptyState
            illustration={
              <LockKeyholeIcon className="mx-auto size-16 text-muted-foreground" />
            }
            title={t("denied.title")}
            description={t("denied.description")}
          />
        ) : (
          children
        )}
      </div>
    </PageBody>
  )
}

/** /parametres ouvre le premier onglet que la personne peut voir. */
export function SettingsIndex() {
  const router = useRouter()
  const [first] = useSettingsTabs()
  useEffect(() => router.replace(first.href), [router, first.href])
  return null
}

/** Phrase d'introduction d'un onglet : ce qu'il règle et pour qui. */
export function SettingsLead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-8 max-w-3xl text-sm text-muted-foreground">{children}</p>
  )
}
