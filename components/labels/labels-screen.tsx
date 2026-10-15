"use client"

import {
  DownloadIcon,
  MinusIcon,
  PlusIcon,
  PrinterIcon,
  ScanBarcodeIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { ItemThumb } from "@/components/items/item-thumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ItemPicker } from "@/components/vouchers/item-picker"
import { useStockAccess } from "@/components/workspace/stock-access"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { StockPermission, type Item } from "@/lib/api/stock"
import { useAssignBarcodes, useLabelSeed } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import {
  LABEL_FORMATS,
  LabelFormatId,
  labelsPerPage,
} from "@/lib/labels/label-formats"
import { LabelQueryParams, Routes } from "@/lib/routes"

import { LabelFormatPicker, SheetStartPicker } from "./label-format-picker"
import { LabelPreview } from "./label-preview"
import { useLabelPdf, type LabelLine } from "./use-label-pdf"

/** Copies d'un article : au-delà, c'est une erreur de frappe. */
const MAX_COPIES = 999
/** Au-delà, le PDF devient long à produire sur un téléphone : on imprime en plusieurs fois. */
const MAX_LABELS = 2000
const FORMAT_STORAGE_KEY = "kreskala.labels.format"
const ID_SEPARATOR = ","

/** Le format choisi la dernière fois sur cet appareil (il dépend de son imprimante). */
function storedFormat(): LabelFormatId {
  try {
    const stored = localStorage.getItem(FORMAT_STORAGE_KEY)
    return (
      Object.values(LabelFormatId).find((id) => id === stored) ??
      LabelFormatId.sheet24
    )
  } catch {
    return LabelFormatId.sheet24
  }
}

function hasBarcode(item: Item): item is Item & { barcode: string } {
  return !!item.barcode
}

/**
 * Étiquettes à imprimer (D36) : des articles et leur nombre de copies, un format, puis le PDF.
 * Prérempli depuis la fiche d'un article ou depuis un bon reçu.
 */
export function LabelsScreen() {
  const t = useTranslations("labels")
  const params = useSearchParams()
  const itemIds = (params.get(LabelQueryParams.items) ?? "")
    .split(ID_SEPARATOR)
    .filter(Boolean)
  const voucherId = params.get(LabelQueryParams.voucher)
  const seed = useLabelSeed(itemIds, voucherId)
  const [lines, setLines] = useState<LabelLine[]>([])
  const [seeded, setSeeded] = useState(false)
  // Lignes de départ posées une fois, à l'arrivée du préremplissage ; ensuite la personne décide.
  if (seed.data && !seeded) {
    setSeeded(true)
    setLines(seed.data)
  }
  const [formatId, setFormatId] = useState<LabelFormatId>(storedFormat)
  const format = LABEL_FORMATS[formatId]
  const [skip, setSkip] = useState(0)
  const pdf = useLabelPdf()

  const add = (item: Item, more = 1) =>
    setLines((current) => {
      const index = current.findIndex((line) => line.item.id === item.id)
      if (index < 0) return [...current, { item, copies: more }]
      return current.map((line, row) =>
        row === index
          ? { ...line, copies: Math.min(MAX_COPIES, line.copies + more) }
          : line
      )
    })
  const setCopies = (itemId: string, copies: number) =>
    setLines((current) =>
      current.map((line) =>
        line.item.id === itemId
          ? { ...line, copies: Math.max(0, Math.min(MAX_COPIES, copies)) }
          : line
      )
    )
  const chooseFormat = (id: LabelFormatId) => {
    setFormatId(id)
    setSkip(0)
    try {
      localStorage.setItem(FORMAT_STORAGE_KEY, id)
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour cette visite.
    }
  }

  const printable = lines.filter((line) => hasBarcode(line.item))
  const missing = lines.filter((line) => !hasBarcode(line.item))
  const total = printable.reduce((sum, line) => sum + line.copies, 0)
  const pages = Math.ceil(
    ((format.sheet ? skip : 0) + total) / labelsPerPage(format)
  )
  const first = printable.find((line) => line.copies > 0)?.item
  const tooMany = total > MAX_LABELS
  const ready = total > 0 && !tooMany && !pdf.busy

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={[
          { label: t("breadcrumb"), href: Routes.items },
          { label: t("title") },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section className="min-w-0 space-y-4" aria-labelledby="label-items">
          <h2 id="label-items" className="font-semibold">
            {t("items.title")}
          </h2>
          <ItemPicker
            excludedIds={new Set(lines.map((line) => line.item.id))}
            onPick={(item) => add(item)}
            onScan={(item) => add(item)}
          />
          {missing.length > 0 && (
            <MissingBarcodes
              items={missing.map((line) => line.item)}
              onAssigned={(items) =>
                setLines((current) =>
                  current.map((line) => ({
                    ...line,
                    item:
                      items.find((item) => item.id === line.item.id) ??
                      line.item,
                  }))
                )
              }
            />
          )}
          {seed.isLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-10 text-center">
              <ScanBarcodeIcon
                className="size-8 text-muted-foreground"
                aria-hidden
              />
              <p className="mt-3 font-medium">{t("items.empty.title")}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {t("items.empty.description")}
              </p>
            </div>
          ) : (
            <ul className="divide-y rounded-2xl border">
              {lines.map((line) => (
                <LabelRow
                  key={line.item.id}
                  line={line}
                  onCopies={(copies) => setCopies(line.item.id, copies)}
                  onRemove={() =>
                    setLines((current) =>
                      current.filter((other) => other.item.id !== line.item.id)
                    )
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <aside
          className="space-y-6 rounded-2xl border p-4 sm:p-5 lg:sticky lg:top-6"
          aria-labelledby="label-format"
        >
          <div className="space-y-3">
            <h2 id="label-format" className="font-semibold">
              {t("formats.label")}
            </h2>
            <LabelFormatPicker value={formatId} onChange={chooseFormat} />
          </div>
          {format.sheet && (
            <SheetStartPicker format={format} skip={skip} onChange={setSkip} />
          )}
          {first && hasBarcode(first) && (
            <LabelPreview item={first} format={format} />
          )}
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm" aria-live="polite">
              <span className="font-semibold tabular-nums">
                {t("summary.labels", { count: total })}
              </span>
              {total > 0 && (
                <span className="text-muted-foreground">
                  {" · "}
                  {format.sheet
                    ? t("summary.sheets", { count: pages })
                    : t("summary.roll")}
                </span>
              )}
            </p>
            {tooMany && (
              <p className="text-sm text-destructive">
                {t("summary.tooMany", { max: MAX_LABELS })}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              <Button
                size="lg"
                className="flex-1"
                disabled={!ready}
                onClick={() => void pdf.download(lines, format, skip)}
              >
                {pdf.busy ? <Spinner /> : <DownloadIcon />}
                {t("download")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                disabled={!ready}
                onClick={() => void pdf.print(lines, format, skip)}
              >
                <PrinterIcon />
                {t("print")}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </PageBody>
  )
}

function LabelRow({
  line,
  onCopies,
  onRemove,
}: {
  line: LabelLine
  onCopies: (copies: number) => void
  onRemove: () => void
}) {
  const t = useTranslations("labels.items")
  const { item } = line
  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap sm:px-4">
      <ItemThumb imageUrl={item.imageUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        {item.barcode ? (
          <p className="font-mono text-xs text-muted-foreground">
            {item.barcode}
          </p>
        ) : (
          <Badge
            variant="outline"
            className="mt-0.5 text-warning-muted-foreground"
          >
            {t("noBarcode")}
          </Badge>
        )}
      </div>
      <InputGroup className="w-32">
        <InputGroupAddon>
          <InputGroupButton
            size="icon-xs"
            aria-label={t("less", { name: item.name })}
            disabled={line.copies <= 0}
            onClick={() => onCopies(line.copies - 1)}
          >
            <MinusIcon />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput
          inputMode="numeric"
          className="text-center tabular-nums"
          aria-label={t("copies", { name: item.name })}
          value={String(line.copies)}
          onChange={(event) => {
            const typed = Number.parseInt(event.target.value, 10)
            onCopies(Number.isNaN(typed) ? 0 : typed)
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={t("more", { name: item.name })}
            onClick={() => onCopies(line.copies + 1)}
          >
            <PlusIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("remove", { name: item.name })}
        onClick={onRemove}
      >
        <XIcon />
      </Button>
    </li>
  )
}

/** Articles sans code-barres : ils ne s'impriment pas ; qui gère le catalogue peut leur en attribuer un. */
function MissingBarcodes({
  items,
  onAssigned,
}: {
  items: Item[]
  onAssigned: (items: Item[]) => void
}) {
  const t = useTranslations("labels.missing")
  const errorMessage = useErrorMessage()
  const manages = useStockAccess().can(StockPermission.manageCatalog)
  const assign = useAssignBarcodes()
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-muted p-3 sm:flex-row sm:items-center"
    >
      <TriangleAlertIcon
        className="hidden size-5 shrink-0 text-warning-muted-foreground sm:block"
        aria-hidden
      />
      <div className="flex-1 text-sm">
        <p className="font-medium">{t("title", { count: items.length })}</p>
        <p className="text-muted-foreground">
          {manages ? t("assignHint") : t("askHint")}
        </p>
      </div>
      {manages && (
        <Button
          variant="outline"
          disabled={assign.isPending}
          onClick={() =>
            assign.mutate(
              items.map((item) => item.id),
              {
                onSuccess: (assigned) => {
                  onAssigned(assigned)
                  toast.success(t("done", { count: items.length }))
                },
                onError: (error) => toast.error(errorMessage(error)),
              }
            )
          }
        >
          {assign.isPending && <Spinner />}
          {t("assign", { count: items.length })}
        </Button>
      )}
    </div>
  )
}
