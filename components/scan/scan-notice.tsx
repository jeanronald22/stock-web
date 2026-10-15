"use client"

import { ScanBarcodeIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Button, buttonVariants } from "@/components/ui/button"
import { useStockAccess } from "@/components/workspace/stock-access"
import { StockPermission } from "@/lib/api/stock"
import { EntryQueryParams, Routes } from "@/lib/routes"
import {
  BarcodeLookupKind,
  type BarcodeLookup,
} from "@/lib/scan/use-barcode-lookup"

/**
 * Un code scanné qui ne mène à rien d'utilisable, dit à l'endroit du scan (D34) : inconnu (avec
 * « Créer l'article » si l'on gère le catalogue), ou article hors du dépôt.
 */
export function ScanNotice({
  result,
  onDismiss,
}: {
  result: Exclude<BarcodeLookup, { kind: "found" }>
  onDismiss: () => void
}) {
  const t = useTranslations("scan")
  const canCreate = useStockAccess().can(StockPermission.manageCatalog)
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t bg-warning-muted/50 px-3 py-2 text-sm text-warning-muted-foreground"
    >
      <ScanBarcodeIcon className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">
        {result.kind === BarcodeLookupKind.unknown
          ? t("unknown", { code: result.code })
          : t("notInWarehouse", { name: result.item.name })}
      </p>
      {result.kind === BarcodeLookupKind.unknown && canCreate && (
        <Link
          href={`${Routes.newItem}?${EntryQueryParams.barcode}=${encodeURIComponent(result.code)}`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          {t("createItem")}
        </Link>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("dismiss")}
        onClick={onDismiss}
      >
        <XIcon />
      </Button>
    </div>
  )
}
