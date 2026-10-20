"use client"

import {
  BellIcon,
  Building2Icon,
  ListChecksIcon,
  LockKeyholeIcon,
  SirenIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useWorkspace } from "@/components/workspace/workspace-context"
import { MembershipRole } from "@/lib/api/platform"
import { StockRole } from "@/lib/api/stock"
import { Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

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
  // Seul onglet ouvert (les notifications d'un magasinier) : pas de navigation.
  const hasNav = tabs.length > 1

  return (
    <PageBody>
      <PageHeader title={t("title")} description={t("description")} />
      <div
        className={cn(
          "mt-8",
          hasNav && "xl:grid xl:grid-cols-[13rem_minmax(0,1fr)] xl:gap-10"
        )}
      >
        {hasNav && (
          <SettingsNav
            label={t("title")}
            tabs={tabs.map((tab) => ({
              ...tab,
              text: t(`tabs.${tab.label}`),
              active: covers(tab, pathname),
            }))}
          />
        )}
        <div className="min-w-0">
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
      </div>
    </PageBody>
  )
}

/**
 * Onglets des paramètres, en colonne à gauche sur grand écran. Plus étroit, ils passent au-dessus :
 * sur une ligne, ou deux par ligne sur téléphone, sans qu'aucun ne soit coupé.
 */
function SettingsNav({
  label,
  tabs,
}: {
  label: string
  tabs: (SettingsTab & { text: string; active: boolean })[]
}) {
  return (
    <nav
      aria-label={label}
      className="mb-8 grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1 sm:flex sm:w-fit sm:flex-wrap xl:sticky xl:top-24 xl:mb-0 xl:w-auto xl:flex-col xl:self-start xl:border-0 xl:bg-transparent xl:p-0"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn(
              "flex h-10 min-w-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
              tab.active
                ? "bg-background text-foreground shadow-sm xl:bg-primary/10 xl:text-primary xl:shadow-none"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{tab.text}</span>
          </Link>
        )
      })}
    </nav>
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
