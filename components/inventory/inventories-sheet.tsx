"use client"

import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { useInventories } from "@/lib/api/inventory-queries"
import { RecordRoutes } from "@/lib/routes"

import { InventoryStatusBadge } from "./inventory-status-badge"

const PAGE_SIZE = 25

/** Historique des inventaires, sans quitter « Stock » : date, dépôt, état, bon des écarts. */
export function InventoriesSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("inventory")
  const format = useFormatter()
  const [page, setPage] = useState(0)
  const inventories = useInventories(undefined, page, PAGE_SIZE)
  const rows = inventories.data?.items ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{t("history.title")}</SheetTitle>
          <SheetDescription>{t("history.description")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {inventories.isPending ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">
              {t("history.empty")}
            </p>
          ) : (
            <ul>
              {rows.map((inventory) => (
                <li key={inventory.id}>
                  <Link
                    href={RecordRoutes.inventory(inventory.id)}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {inventory.warehouse.name}
                        {inventory.category && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {inventory.category.name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format.dateTime(new Date(inventory.startedAt), {
                          dateStyle: "medium",
                        })}
                        {" · "}
                        {inventory.adjustment
                          ? inventory.adjustment.number
                          : t("progress", {
                              counted: inventory.progress.counted,
                              lines: inventory.progress.lines,
                            })}
                      </p>
                    </div>
                    <InventoryStatusBadge status={inventory.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {(inventories.data?.total ?? 0) > PAGE_SIZE && (
          <div className="flex justify-between border-t p-2">
            <Button
              variant="ghost"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              {t("history.newer")}
            </Button>
            <Button
              variant="ghost"
              disabled={
                (page + 1) * PAGE_SIZE >= (inventories.data?.total ?? 0)
              }
              onClick={() => setPage(page + 1)}
            >
              {t("history.older")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
