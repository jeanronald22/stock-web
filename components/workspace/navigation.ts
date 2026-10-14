import {
  BoxesIcon,
  HouseIcon,
  LayersIcon,
  ReceiptTextIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"

import { Routes } from "@/lib/routes"

export type NavigationEntry = {
  href: string
  icon: LucideIcon
  /** Clé de message sous « nav ». */
  label: "home" | "stock" | "vouchers" | "items" | "warehouses"
}

/** Menu de la barre latérale : n'y figurent que les écrans disponibles. */
export const workspaceNavigation: readonly NavigationEntry[] = [
  { href: Routes.dashboard, icon: HouseIcon, label: "home" },
  { href: Routes.stock, icon: LayersIcon, label: "stock" },
  { href: Routes.vouchers, icon: ReceiptTextIcon, label: "vouchers" },
  { href: Routes.warehouses, icon: WarehouseIcon, label: "warehouses" },
  { href: Routes.items, icon: BoxesIcon, label: "items" },
]

/** L'entrée reste active sur ses sous-écrans : /articles/nouveau garde « Articles » en surbrillance. */
export function isActiveEntry(
  entry: NavigationEntry,
  pathname: string
): boolean {
  return pathname === entry.href || pathname.startsWith(`${entry.href}/`)
}
