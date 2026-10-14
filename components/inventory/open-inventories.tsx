"use client"

import { ClipboardListIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Progress } from "@/components/ui/progress"
import { buttonVariants } from "@/components/ui/button"
import { InventoryStatus } from "@/lib/api/inventories"
import { useInventories } from "@/lib/api/inventory-queries"
import { RecordRoutes } from "@/lib/routes"

/** Un dépôt n'a qu'un inventaire ouvert à la fois : cette liste reste courte. */
const OPEN_SHOWN = 20

/** Inventaires en cours dans ses dépôts : on les reprend d'un geste, magasiniers compris. */
export function OpenInventories() {
  const t = useTranslations("inventory")
  const open = useInventories(InventoryStatus.open, 0, OPEN_SHOWN)
  const inventories = open.data?.items ?? []
  if (inventories.length === 0) return null
  return (
    <ul className="mt-6 space-y-2" aria-label={t("openTitle")}>
      {inventories.map((inventory) => {
        const { lines, counted } = inventory.progress
        return (
          <li
            key={inventory.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-warning/40 bg-warning-muted/50 p-3"
          >
            <ClipboardListIcon
              className="size-5 text-warning-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {t("inProgress", { warehouse: inventory.warehouse.name })}
                {inventory.category && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {inventory.category.name}
                  </span>
                )}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <Progress
                  value={lines === 0 ? 0 : (counted / lines) * 100}
                  className="max-w-48"
                  aria-label={t("progress", { counted, lines })}
                />
                <span className="text-sm text-muted-foreground tabular-nums">
                  {t("progress", { counted, lines })}
                </span>
              </div>
            </div>
            <Link
              href={RecordRoutes.inventory(inventory.id)}
              className={buttonVariants()}
            >
              {t("resume")}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
