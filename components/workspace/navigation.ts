import {
  BoxesIcon,
  HouseIcon,
  LayersIcon,
  ReceiptTextIcon,
  TruckIcon,
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
    | "home"
    | "stock"
    | "vouchers"
    | "items"
    | "suppliers"
    | "warehouses"
    | "team"
  /** Réservé au propriétaire et aux administrateurs (DECISIONS.md, D25). */
  teamManagersOnly?: boolean
}

/** Menu de la barre latérale : n'y figurent que les écrans disponibles. */
export const workspaceNavigation: readonly NavigationEntry[] = [
  { href: Routes.dashboard, icon: HouseIcon, label: "home" },
  { href: Routes.stock, icon: LayersIcon, label: "stock" },
  { href: Routes.vouchers, icon: ReceiptTextIcon, label: "vouchers" },
  { href: Routes.items, icon: BoxesIcon, label: "items" },
  { href: Routes.suppliers, icon: TruckIcon, label: "suppliers" },
  { href: Routes.warehouses, icon: WarehouseIcon, label: "warehouses" },
  { href: Routes.team, icon: UsersIcon, label: "team", teamManagersOnly: true },
]

/** L'entrée reste active sur ses sous-écrans : /articles/nouveau garde « Articles » en surbrillance. */
export function isActiveEntry(
  entry: NavigationEntry,
  pathname: string
): boolean {
  return pathname === entry.href || pathname.startsWith(`${entry.href}/`)
}
