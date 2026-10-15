"use client"

import { InventoriesSheet } from "./inventories-sheet"
import { OpenInventories } from "./open-inventories"
import { StartInventorySheet } from "./start-inventory-sheet"

/** Inventaires dans « Stock » (D32, pas d'onglet en plus) : lancer, reprendre, relire. */
export function InventoryBar({ extra }: { extra?: React.ReactNode }) {
  return (
    <section>
      <div className="mt-4 flex flex-wrap gap-2">
        <StartInventorySheet />
        <InventoriesSheet />
        {extra}
      </div>
      <OpenInventories />
    </section>
  )
}
