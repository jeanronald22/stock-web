"use client"

import {
  ArrowRightIcon,
  BanIcon,
  CircleCheckIcon,
  ClipboardCheckIcon,
  ScanBarcodeIcon,
  SearchIcon,
} from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { BarcodeScanner } from "@/components/scan/barcode-scanner"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import {
  InventoryStatus,
  movedLinesOf,
  SheetFilter,
  sheetFilters,
  type Inventory,
  type MovedLine,
} from "@/lib/api/inventories"
import {
  useCancelInventory,
  useCloseInventory,
  useInventory,
  useInventoryLines,
} from "@/lib/api/inventory-queries"
import { StockPermission } from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { RecordRoutes, Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { COUNT_INPUT_ATTRIBUTE, CountLine } from "./count-line"
import { FoundItemSheet } from "./found-item-sheet"
import { InventoryStatusBadge } from "./inventory-status-badge"

const PAGE_SIZE = 50
const SEARCH_DELAY_MS = 300
/** Valeur « Tout » du filtre de la feuille. */
const ALL_LINES = "all"
type LineFilter = SheetFilter | typeof ALL_LINES

export function InventoryScreen({ id }: { id: string }) {
  const t = useTranslations("inventory")
  const inventory = useInventory(id)
  if (inventory.isPending) {
    return (
      <PageBody>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      </PageBody>
    )
  }
  if (!inventory.data) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("notFound")}
          description=""
          action={
            <Link
              href={Routes.stock}
              className={buttonVariants({ variant: "outline" })}
            >
              {t("backToStock")}
            </Link>
          }
        />
      </PageBody>
    )
  }
  return <InventorySheet inventory={inventory.data} />
}

/**
 * Feuille de comptage d'un dépôt (D32) : recherche, filtres, saisie ligne à ligne au clavier
 * (Entrée enregistre et passe à la ligne suivante), puis clôture par un correcteur.
 */
function InventorySheet({ inventory }: { inventory: Inventory }) {
  const t = useTranslations("inventory")
  const format = useFormatter()
  const { can, covers } = useStockAccess()
  const open = inventory.status === InventoryStatus.open
  const inScope = covers(inventory.warehouse.id)
  const canCount = open && inScope && can(StockPermission.recordMovements)
  const canClose = open && inScope && can(StockPermission.correctStock)
  const { lines, counted, gaps } = inventory.progress

  const [typed, setTyped] = useState("")
  const [text, setText] = useState("")
  useEffect(() => {
    const timer = window.setTimeout(
      () => setText(typed.trim()),
      SEARCH_DELAY_MS
    )
    return () => window.clearTimeout(timer)
  }, [typed])
  // Ouvert : on part de ce qui reste à compter ; terminé : on relit les écarts. Clôturé à l'écran,
  // « À compter » n'a plus d'objet : la feuille passe aux écarts.
  const [chosenFilter, setFilter] = useState<LineFilter>(
    open ? SheetFilter.toCount : SheetFilter.gaps
  )
  const filter =
    !open && chosenFilter === SheetFilter.toCount
      ? SheetFilter.gaps
      : chosenFilter
  const filters = open
    ? sheetFilters
    : sheetFilters.filter((value) => value !== SheetFilter.toCount)
  const [page, setPage] = useState(0)
  const [moved, setMoved] = useState<MovedLine[]>([])
  const search = useMemo(
    () => ({
      text: text || undefined,
      filter: filter === ALL_LINES ? undefined : filter,
    }),
    [text, filter]
  )
  const sheet = useInventoryLines(inventory.id, search, page, PAGE_SIZE)
  const rows = sheet.data?.items ?? []
  const total = sheet.data?.total ?? 0
  const listRef = useRef<HTMLUListElement>(null)
  const [scanning, setScanning] = useState(false)
  // Après un scan, la saisie va à la ligne trouvée dès qu'elle s'affiche.
  const focusFound = useRef(false)
  useEffect(() => {
    if (!focusFound.current || sheet.isFetching) return
    focusFound.current = false
    listRef.current
      ?.querySelector<HTMLInputElement>(`[${COUNT_INPUT_ATTRIBUTE}]`)
      ?.focus()
  }, [sheet.isFetching, sheet.data])

  /** Scan (D34) : la recherche trouve l'article par son code exact, sur toute la feuille. */
  const scanned = (code: string) => {
    setTyped(code)
    setText(code)
    setFilter(ALL_LINES)
    setPage(0)
    focusFound.current = true
  }

  /** Après un comptage, la saisie passe à la ligne suivante (ou reste en place si la ligne quitte le filtre). */
  const focusAfter = (index: number) =>
    // Après le rendu (la ligne comptée a quitté la liste), et sans voler la saisie en cours :
    // qui tape déjà le comptage suivant garde son curseur.
    requestAnimationFrame(() => {
      const list = listRef.current
      const active = document.activeElement
      if (
        list &&
        active instanceof HTMLElement &&
        list.contains(active) &&
        active.hasAttribute(COUNT_INPUT_ATTRIBUTE)
      )
        return
      const inputs = list?.querySelectorAll<HTMLInputElement>(
        `[${COUNT_INPUT_ATTRIBUTE}]`
      )
      const next =
        inputs?.[filter === SheetFilter.toCount ? index : index + 1] ??
        inputs?.[0]
      next?.focus()
    })

  return (
    <PageBody>
      <PageHeader
        title={t("title", { warehouse: inventory.warehouse.name })}
        breadcrumbs={[
          { label: t("stock"), href: Routes.stock },
          { label: t("breadcrumb") },
        ]}
        description={[
          inventory.category
            ? t("cycleOf", { category: inventory.category.name })
            : t("full"),
          t("startedBy", {
            name: inventory.startedByName,
            date: format.dateTime(new Date(inventory.startedAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          }),
        ].join(" · ")}
        badges={<InventoryStatusBadge status={inventory.status} />}
        actions={
          <>
            {canClose && <CancelInventory inventory={inventory} />}
            {canClose && (
              <CloseInventory
                inventory={inventory}
                onMoved={(lines) => {
                  setMoved(lines)
                  setFilter(SheetFilter.gaps)
                  setPage(0)
                }}
              />
            )}
          </>
        }
      />

      <div className="mt-8 grid gap-4 rounded-2xl border p-5 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <p className="label-caps">{t("progressTitle")}</p>
          <p className="mt-1 num text-2xl font-semibold">
            {t("progress", { counted, lines })}
          </p>
          <Progress
            value={lines === 0 ? 0 : (counted / lines) * 100}
            className="mt-2"
            aria-label={t("progress", { counted, lines })}
          />
        </div>
        <div>
          <p className="label-caps">{t("gapsTitle")}</p>
          <p
            className={cn(
              "mt-1 num text-2xl font-semibold",
              gaps > 0 && "text-warning-muted-foreground"
            )}
          >
            {gaps}
          </p>
        </div>
      </div>

      {inventory.status === InventoryStatus.closed && (
        <ClosedSummary inventory={inventory} />
      )}

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <InputGroup className="lg:max-w-sm lg:flex-1">
          <InputGroupInput
            type="search"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value)
              setPage(0)
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
          />
          <InputGroupAddon>
            {sheet.isFetching ? <Spinner /> : <SearchIcon />}
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
          onDetected={scanned}
        />
        <div
          role="tablist"
          aria-label={t("filterLabel")}
          className="inline-flex flex-wrap rounded-xl border bg-muted/40 p-1"
        >
          {([...filters, ALL_LINES] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => {
                setFilter(value)
                setPage(0)
              }}
              className={cn(
                "h-9 rounded-lg px-3 text-sm font-medium transition-colors",
                filter === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`filters.${value}`)}
            </button>
          ))}
        </div>
        {canCount && (
          <div className="lg:ml-auto">
            <FoundItemSheet inventoryId={inventory.id} />
          </div>
        )}
      </div>

      {sheet.isPending ? (
        <Skeleton className="mt-4 h-64 rounded-2xl" />
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {open && filter === SheetFilter.toCount && !text
            ? t("allCounted")
            : t("noLine")}
        </p>
      ) : (
        <ul
          ref={listRef}
          className={cn(
            "mt-4 space-y-2 transition-opacity",
            sheet.isPlaceholderData && "opacity-60"
          )}
        >
          {rows.map((line, index) => (
            <CountLine
              key={`${line.item.id}-${line.batch ?? ""}-${line.count?.first.at ?? ""}-${line.count?.recount?.at ?? ""}`}
              inventoryId={inventory.id}
              warehouseId={inventory.warehouse.id}
              line={line}
              editable={canCount}
              flagged={moved.some(
                (candidate) =>
                  candidate.itemId === line.item.id &&
                  candidate.batch === (line.batch ?? "")
              )}
              onSaved={() => focusAfter(index)}
            />
          ))}
        </ul>
      )}
      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            {t("previous")}
          </Button>
          <span>
            {t("page", { page: page + 1, pages: Math.ceil(total / PAGE_SIZE) })}
          </span>
          <Button
            variant="outline"
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage(page + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </PageBody>
  )
}

/** Clôture : résumé de ce qui va bouger, et de ce qui ne bougera pas (lignes non comptées). */
function CloseInventory({
  inventory,
  onMoved,
}: {
  inventory: Inventory
  onMoved: (lines: MovedLine[]) => void
}) {
  const t = useTranslations("inventory.close")
  const tCommon = useTranslations("common")
  const errorMessage = useErrorMessage()
  const close = useCloseInventory()
  const { lines, counted, gaps } = inventory.progress

  // mutateAsync : une fois clos, ce bouton disparaît ; le message doit partir quand même.
  const confirm = async () => {
    try {
      const closed = await close.mutateAsync(inventory.id)
      toast.success(
        closed.adjustment
          ? t("done", { number: closed.adjustment.number })
          : t("doneWithoutGap")
      )
    } catch (error) {
      const moved = movedLinesOf(error)
      if (moved.length > 0) {
        onMoved(moved)
        toast.error(t("moved", { count: moved.length }))
      } else toast.error(errorMessage(error))
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button disabled={close.isPending || counted === 0} />}
      >
        {close.isPending ? <Spinner /> : <ClipboardCheckIcon />}
        {t("action")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("summary", { gaps, uncounted: lines - counted })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogCancel onClick={() => void confirm()}>
            {t("confirm")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CancelInventory({ inventory }: { inventory: Inventory }) {
  const t = useTranslations("inventory.cancel")
  const tCommon = useTranslations("common")
  const errorMessage = useErrorMessage()
  const cancel = useCancelInventory()
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            className="text-muted-foreground"
            disabled={cancel.isPending}
          />
        }
      >
        <BanIcon />
        {t("action")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogCancel
            variant="destructive"
            onClick={() =>
              cancel
                .mutateAsync(inventory.id)
                .then(() => toast.success(t("done")))
                .catch((error: unknown) => toast.error(errorMessage(error)))
            }
          >
            {t("action")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Clôture (D32) : qui, quand, et le bon d'ajustement qui a inscrit les écarts au stock. */
function ClosedSummary({ inventory }: { inventory: Inventory }) {
  const t = useTranslations("inventory")
  const format = useFormatter()
  return (
    <div
      role="status"
      className="mt-4 flex gap-3 rounded-xl border border-success/40 bg-success-muted px-4 py-3 text-sm text-success-muted-foreground"
    >
      <CircleCheckIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="font-medium">
          {inventory.adjustment
            ? t("closedWithAdjustment")
            : t("closedWithoutGap")}
        </p>
        {inventory.endedAt && (
          <p>
            {t("closedBy", {
              name: inventory.endedByName ?? "",
              date: format.dateTime(new Date(inventory.endedAt), {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        )}
        {inventory.adjustment && (
          <Link
            href={RecordRoutes.voucher(inventory.adjustment.id)}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            {t("seeAdjustment", { number: inventory.adjustment.number })}
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  )
}
