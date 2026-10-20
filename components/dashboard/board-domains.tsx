"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import { useListParams } from "@/lib/list/use-list-params"
import { ListQueryParams } from "@/lib/routes"
import { cn } from "@/lib/utils"

/** Domaines du tableau de bord (D43) ; la valeur est celle de l'adresse. */
export const BoardDomain = {
  activity: "activite",
  stock: "stock",
  issues: "sorties",
  quality: "qualite",
  team: "equipe",
} as const
export type BoardDomain = (typeof BoardDomain)[keyof typeof BoardDomain]

const DOMAINS = Object.entries(BoardDomain) as [
  keyof typeof BoardDomain,
  BoardDomain,
][]
const SEPARATOR = ","

/**
 * Domaines affichés, gardés dans l'adresse : aucun choisi, tous. Choisir un domaine quand tout est
 * affiché ne garde que lui ; les suivants s'ajoutent ou se retirent.
 */
export function useBoardDomains() {
  const params = useSearchParams()
  const { setDomains } = useListParams()
  const chosen = new Set(
    (params.get(ListQueryParams.domain) ?? "")
      .split(SEPARATOR)
      .filter((value): value is BoardDomain =>
        DOMAINS.some(([, domain]) => domain === value)
      )
  )
  const all = chosen.size === 0 || chosen.size === DOMAINS.length
  return {
    all,
    shows: (domain: BoardDomain) => all || chosen.has(domain),
    isChosen: (domain: BoardDomain) => !all && chosen.has(domain),
    toggle: (domain: BoardDomain) => {
      const next = all
        ? new Set([domain])
        : new Set(
            chosen.has(domain)
              ? [...chosen].filter((value) => value !== domain)
              : [...chosen, domain]
          )
      setDomains(
        next.size === 0 || next.size === DOMAINS.length ? undefined : [...next]
      )
    },
    showAll: () => setDomains(undefined),
  }
}

/** Puces des domaines : « Tout », puis chacun ; ceux qui sont affichés sont pleins. */
export function BoardDomainChips({
  domains,
}: {
  domains: ReturnType<typeof useBoardDomains>
}) {
  const t = useTranslations("dashboard.board.domains")
  const chip = (active: boolean) =>
    cn(
      "h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
    )
  return (
    <div
      role="group"
      aria-label={t("label")}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0"
    >
      <button
        type="button"
        aria-pressed={domains.all}
        className={chip(domains.all)}
        onClick={domains.showAll}
      >
        {t("all")}
      </button>
      {DOMAINS.map(([key, domain]) => (
        <button
          key={domain}
          type="button"
          aria-pressed={domains.isChosen(domain)}
          className={chip(domains.isChosen(domain))}
          onClick={() => domains.toggle(domain)}
        >
          {t(key)}
        </button>
      ))}
    </div>
  )
}
