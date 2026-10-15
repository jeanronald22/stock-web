import {
  BoxesIcon,
  ContactRoundIcon,
  HouseIcon,
  LayersIcon,
  ReceiptTextIcon,
  UsersIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"

import { Routes } from "@/lib/routes"

export type NavigationEntry = {
  href: string
  icon: LucideIcon
  /** Clé de message sous « nav ». */
  label:
    "home" | "stock" | "vouchers" | "items" | "contacts" | "warehouses" | "team"
  section: NavigationSection
  /** Autres écrans de l'entrée : « Contacts » couvre fournisseurs et clients (D30). */
  alsoActiveOn?: readonly string[]
  /** Réservé au propriétaire et aux administrateurs (DECISIONS.md, D25). */
  teamManagersOnly?: boolean
}

/** Compartiments du menu, dans l'ordre d'affichage ; la vue d'ensemble n'a pas de titre. */
export const navigationSections = [
  "overview",
  "operations",
  "catalog",
  "administration",
] as const
export type NavigationSection = (typeof navigationSections)[number]

/** Au-delà, le menu se range par compartiments : il reste lisible d'un coup d'œil. */
export const MAX_FLAT_ENTRIES = 5

export type NavigationGroup = {
  /** null : sans titre (menu court, ou vue d'ensemble). */
  section: NavigationSection | null
  entries: NavigationEntry[]
}

/** Menu à plat jusqu'à MAX_FLAT_ENTRIES entrées, par compartiments au-delà. */
export function groupNavigation(
  entries: readonly NavigationEntry[]
): NavigationGroup[] {
  if (entries.length <= MAX_FLAT_ENTRIES)
    return [{ section: null, entries: [...entries] }]
  return navigationSections
    .map((section) => ({
      section: section === "overview" ? null : section,
      entries: entries.filter((entry) => entry.section === section),
    }))
    .filter((group) => group.entries.length > 0)
}

/** Menu de la barre latérale : n'y figurent que les écrans disponibles. */
export const workspaceNavigation: readonly NavigationEntry[] = [
  {
    href: Routes.dashboard,
    icon: HouseIcon,
    label: "home",
    section: "overview",
  },
  {
    href: Routes.stock,
    // Les rapports (D38) se lisent depuis le stock : pas d'entrée à eux.
    alsoActiveOn: [Routes.reports],
    icon: LayersIcon,
    label: "stock",
    section: "operations",
  },
  {
    href: Routes.vouchers,
    icon: ReceiptTextIcon,
    label: "vouchers",
    section: "operations",
  },
  { href: Routes.items, icon: BoxesIcon, label: "items", section: "catalog" },
  {
    href: Routes.suppliers,
    icon: ContactRoundIcon,
    label: "contacts",
    section: "catalog",
    alsoActiveOn: [Routes.customers],
  },
  {
    href: Routes.warehouses,
    icon: WarehouseIcon,
    label: "warehouses",
    section: "catalog",
  },
  {
    href: Routes.team,
    icon: UsersIcon,
    label: "team",
    section: "administration",
    teamManagersOnly: true,
  },
]

/** L'entrée reste active sur ses sous-écrans : /articles/nouveau garde « Articles » en surbrillance. */
export function isActiveEntry(
  entry: NavigationEntry,
  pathname: string
): boolean {
  return [entry.href, ...(entry.alsoActiveOn ?? [])].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  )
}
