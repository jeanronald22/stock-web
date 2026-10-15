"use client"

import { PlusIcon, ScanBarcodeIcon, SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useDeferredValue, useMemo, useState } from "react"

import { BarcodeScanner } from "@/components/scan/barcode-scanner"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ItemThumb } from "@/components/items/item-thumb"
import { Spinner } from "@/components/ui/spinner"
import { CatalogStatus, type Item } from "@/lib/api/stock"
import { useItemsPage } from "@/lib/api/stock-queries"
import { useBarcodeLookup } from "@/lib/scan/use-barcode-lookup"
import { cn } from "@/lib/utils"

const RESULTS = 8
const ENTER = "Enter"

/**
 * Recherche d'un article à ajouter au bon. Pour une sortie, seuls les articles proposés dans le
 * dépôt ([warehouseId]) sont cherchés ; pour une réception, tout le catalogue.
 */
export function ItemPicker({
  warehouseId,
  excludedIds,
  onPick,
  onScan,
  inputRef,
  autoFocus,
  supplier,
}: {
  /** Article scanné (D34) : déjà sur le bon, il n'est pas exclu ; à défaut, [onPick]. */
  onScan?: (item: Item) => void
  /** Réception : ses articles d'abord, tout le catalogue d'un clic. */
  supplier?: { id: string; name: string } | null
  /** Champ de recherche : la saisie y revient après chaque quantité (touche Entrée). */
  inputRef?: React.Ref<HTMLInputElement>
  autoFocus?: boolean
  warehouseId?: string
  /** Déjà sur le bon (un article suivi par lot peut revenir, pour un autre lot). */
  excludedIds: ReadonlySet<string>
  onPick: (item: Item) => void
}) {
  const t = useTranslations("vouchers.form")
  const [text, setText] = useState("")
  // « Tout le catalogue », retenu par fournisseur : changer de fournisseur revient à ses articles.
  const [allFor, setAllFor] = useState<string | null>(null)
  const onlySupplier = !!supplier && allFor !== supplier.id
  const supplierId = onlySupplier ? supplier?.id : undefined
  const deferred = useDeferredValue(text.trim())
  const search = useMemo(
    () => ({
      text: deferred || undefined,
      warehouseId,
      supplierId,
      status: CatalogStatus.active,
    }),
    [deferred, warehouseId, supplierId]
  )
  const results = useItemsPage(search, 0, RESULTS)
  const items = (results.data?.items ?? []).filter(
    (item) => !excludedIds.has(item.id)
  )
  const [scanning, setScanning] = useState(false)
  const lookup = useBarcodeLookup()
  const scanned = async (code: string) => {
    const item = await lookup(code, warehouseId)
    if (item) (onScan ?? onPick)(item)
  }
  const pick = (item: Item) => {
    onPick(item)
    setText("")
  }

  /**
   * Entrée : l'article dont le code-barres est exactement le texte (une douchette tape le code puis
   * Entrée), sinon le seul résultat ; sinon on laisse choisir.
   */
  const onEnter = () => {
    const typed = text.trim()
    const exact = (results.data?.items ?? []).find(
      (item) => item.barcode === typed
    )
    if (exact) {
      ;(onScan ?? onPick)(exact)
      setText("")
    } else if (items.length === 1) pick(items[0])
  }

  return (
    <div className="rounded-xl border">
      <InputGroup className="rounded-b-none border-0 border-b">
        <InputGroupInput
          ref={inputRef}
          autoFocus={autoFocus}
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== ENTER || !text.trim()) return
            event.preventDefault()
            onEnter()
          }}
          placeholder={t("searchItem")}
          aria-label={t("searchItem")}
        />
        <InputGroupAddon>
          {results.isFetching ? <Spinner /> : <SearchIcon />}
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={t("scan")}
            onClick={() => setScanning(true)}
          >
            <ScanBarcodeIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <BarcodeScanner
        open={scanning}
        onOpenChange={setScanning}
        onDetected={(code) => void scanned(code)}
      />
      {supplier && (
        <div
          className="flex flex-wrap gap-2 border-b px-3 py-2"
          role="radiogroup"
        >
          {[
            { only: true, label: t("supplierItems", { name: supplier.name }) },
            { only: false, label: t("allItems") },
          ].map((choice) => (
            <button
              key={String(choice.only)}
              type="button"
              role="radio"
              aria-checked={onlySupplier === choice.only}
              onClick={() => setAllFor(choice.only ? null : supplier.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                onlySupplier === choice.only
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "hover:bg-muted"
              )}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}
      <ul className="max-h-64 overflow-y-auto p-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => pick(item)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <ItemThumb imageUrl={item.imageUrl} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.name}
                </span>
                {item.reference && (
                  <span className="block font-mono text-xs text-muted-foreground">
                    {item.reference}
                  </span>
                )}
              </span>
              <PlusIcon className="size-4 text-primary" aria-hidden />
            </button>
          </li>
        ))}
        {results.isSuccess && items.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-muted-foreground">
            {onlySupplier
              ? t("noSupplierItem")
              : warehouseId
                ? t("noItemInWarehouse")
                : t("noItem")}
          </li>
        )}
      </ul>
    </div>
  )
}
