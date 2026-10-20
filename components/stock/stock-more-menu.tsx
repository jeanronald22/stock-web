"use client"

import {
  ClipboardListIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  HistoryIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { InventoriesSheet } from "@/components/inventory/inventories-sheet"
import { StartInventorySheet } from "@/components/inventory/start-inventory-sheet"
import { useExport } from "@/components/reports/report-parts"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useStockAccess } from "@/components/workspace/stock-access"
import { StockPermission } from "@/lib/api/stock"
import type { StockSearch } from "@/lib/api/vouchers"

import { useStockExport } from "./use-stock-export"

/**
 * Actions moins fréquentes de « Stock », derrière un seul bouton : inventaire (D32) et export
 * (D38). L'export suit les filtres affichés ; sans stock, il n'est pas proposé.
 * Les rapports s'ouvrent depuis le tableau de bord (D43).
 */
export function StockMoreMenu({
  search,
  canExport,
}: {
  search: StockSearch
  canExport: boolean
}) {
  const t = useTranslations()
  const counts = useStockAccess().can(StockPermission.correctStock)
  const exporter = useExport(useStockExport(search))
  const [starting, setStarting] = useState(false)
  const [history, setHistory] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-lg"
              aria-label={t("stock.more")}
            />
          }
        >
          {exporter.busy ? <Spinner /> : <EllipsisVerticalIcon />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {counts && (
            <DropdownMenuItem onClick={() => setStarting(true)}>
              <ClipboardListIcon />
              {t("inventory.start.open")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setHistory(true)}>
            <HistoryIcon />
            {t("inventory.history.open")}
          </DropdownMenuItem>
          {canExport && <DropdownMenuSeparator />}
          {canExport && (
            <DropdownMenuItem
              disabled={exporter.busy}
              onClick={() => void exporter.run()}
            >
              <DownloadIcon />
              {t("reports.exportButton")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {counts && (
        <StartInventorySheet open={starting} onOpenChange={setStarting} />
      )}
      <InventoriesSheet open={history} onOpenChange={setHistory} />
    </>
  )
}
