"use client"

import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export type SectionTab = {
  href: string
  icon: LucideIcon
  label: string
  /** Pastille : un nombre qui attend une action (demandes à valider). */
  count?: number
  /** Préfixes d'adresse qui gardent l'onglet actif, en plus de [href] et de ses sous-écrans. */
  alsoActiveOn?: readonly string[]
  /** Sous-écrans qui appartiennent à un autre onglet (/bons/demandes n'est pas « Bons »). */
  except?: readonly string[]
  /** Paramètres gardés d'un onglet à l'autre (la période d'un rapport), sans le « ? ». */
  query?: string
}

/**
 * Onglets d'une même entrée de menu (DECISIONS.md, D29 et D30) : ce sont des liens, l'adresse dit
 * quel onglet est ouvert.
 */
export function SectionTabs({
  label,
  tabs,
}: {
  label: string
  tabs: SectionTab[]
}) {
  const pathname = usePathname()
  const isActive = (tab: SectionTab) =>
    !tab.except?.some((prefix) => pathname.startsWith(prefix)) &&
    [tab.href, ...(tab.alsoActiveOn ?? [])].some(
      (href) => pathname === href || pathname.startsWith(`${href}/`)
    )
  return (
    <nav
      aria-label={label}
      className="mt-6 inline-flex max-w-full overflow-x-auto rounded-xl border bg-muted/40 p-1"
    >
      {tabs.map((tab) => {
        const active = isActive(tab)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.query ? `${tab.href}?${tab.query}` : tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {tab.label}
            {!!tab.count && (
              <span className="rounded-full bg-warning-muted px-1.5 text-xs font-semibold text-warning-muted-foreground tabular-nums">
                {tab.count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
