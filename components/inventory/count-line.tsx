"use client"

import { CheckIcon, PencilIcon, RotateCcwIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { useBatchLabel, useQuantityLabel } from "@/components/items/describe"
import { ItemThumb } from "@/components/items/item-thumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  BASE_UNIT_CHOICE,
  baseQuantity,
} from "@/components/vouchers/voucher-form-schema"
import type { SheetLine, Tally } from "@/lib/api/inventories"
import { LocationLabel } from "@/components/locations/location-label"
import { useCountLine } from "@/lib/api/inventory-queries"
import {
  defaultPackaging,
  EntryDirection,
  wholeQuantityUnits,
} from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { parseQuantity } from "@/lib/forms/quantity"
import { cn } from "@/lib/utils"

/** Saisie d'un comptage : premier comptage, correction, ou second comptage d'une ligne en écart. */
const Mode = { count: "count", recount: "recount" } as const
type Mode = (typeof Mode)[keyof typeof Mode]

/** Attribut des champs de comptage : Entrée passe au suivant, dans l'ordre de la feuille. */
export const COUNT_INPUT_ATTRIBUTE = "data-count-input"

/**
 * Une ligne de la feuille. Comptage à l'aveugle : le théorique ne s'affiche qu'une fois la ligne
 * comptée, pour ne pas influencer la personne qui compte (D32).
 */
export function CountLine({
  inventoryId,
  warehouseId,
  line,
  editable,
  flagged,
  onSaved,
}: {
  inventoryId: string
  /** Dépôt compté : l'emplacement de l'article y est montré (D37). */
  warehouseId: string
  line: SheetLine
  editable: boolean
  /** À recompter : la clôture a été refusée pour cette ligne. */
  flagged: boolean
  onSaved: () => void
}) {
  const t = useTranslations("inventory.line")
  const tUnits = useTranslations("units")
  const quantityLabel = useQuantityLabel()
  const batchLabel = useBatchLabel()
  const errorMessage = useErrorMessage()
  const count = useCountLine(inventoryId)
  const { item, count: counted } = line
  const [mode, setMode] = useState<Mode | null>(counted ? null : Mode.count)
  const [typed, setTyped] = useState("")
  const location = item.warehouses.find(
    (placement) => placement.warehouseId === warehouseId
  )?.location
  // Comptage : le conditionnement proposé d'office pour les sorties (D36), comme sur les étagères.
  const [unit, setUnit] = useState<string>(
    () =>
      defaultPackaging(item.packagings, EntryDirection.issue)?.name ??
      BASE_UNIT_CHOICE
  )
  const [error, setError] = useState<string | null>(null)
  const label = (quantity: number) => quantityLabel(item.baseUnit, quantity)

  const entered = parseQuantity(typed)
  const converted =
    entered !== null && unit !== BASE_UNIT_CHOICE
      ? baseQuantity(item, entered, unit)
      : null

  const save = async () => {
    if (entered === null || entered < 0) return setError(t("invalid"))
    if (
      wholeQuantityUnits.has(item.baseUnit) &&
      !Number.isInteger(baseQuantity(item, entered, unit))
    )
      return setError(t("whole"))
    setError(null)
    try {
      await count.mutateAsync({
        itemId: item.id,
        quantity: entered,
        packagingName: unit === BASE_UNIT_CHOICE ? undefined : unit,
        batch: line.batch ?? undefined,
        recount: mode === Mode.recount,
      })
      setTyped("")
      setMode(null)
      onSaved()
    } catch (failure) {
      toast.error(errorMessage(failure))
    }
  }

  const units = [
    { value: BASE_UNIT_CHOICE, label: tUnits(`${item.baseUnit}.label`) },
    ...item.packagings.map((packaging) => ({
      value: packaging.name,
      label: `${packaging.name} (${label(packaging.quantity)})`,
    })),
  ]

  return (
    <li
      className={cn(
        "rounded-xl border p-3",
        flagged && "border-destructive/60 bg-destructive/5"
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <ItemThumb imageUrl={item.imageUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.name}</p>
          {location && (
            <LocationLabel location={location} className="text-xs" />
          )}
          <p className="truncate text-xs text-muted-foreground">
            {[
              item.reference,
              line.batch && t("batch", { batch: batchLabel(line.batch, line) }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {counted && !mode && <GapBadge gap={counted.gap} label={label} />}
      </div>

      {counted && !mode && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="space-y-0.5 text-muted-foreground">
            <TallyText
              tally={counted.first}
              prefix={counted.recount ? t("firstCount") : t("counted")}
              label={label}
            />
            {counted.recount && (
              <TallyText
                tally={counted.recount}
                prefix={t("recount")}
                label={label}
              />
            )}
          </div>
          {editable && (
            <div className="flex gap-1">
              {counted.gap !== 0 && !counted.recount && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode(Mode.recount)}
                >
                  <RotateCcwIcon />
                  {t("recountAction")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode(Mode.count)}
              >
                <PencilIcon />
                {t("correct")}
              </Button>
            </div>
          )}
        </div>
      )}

      {editable && mode && (
        <div className="mt-3">
          {mode === Mode.recount && (
            <p className="mb-2 text-sm text-muted-foreground">
              {t("recountHint")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <InputGroup className="w-32">
              <InputGroupInput
                inputMode="decimal"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={t("countedPlaceholder")}
                aria-label={`${mode === Mode.recount ? t("recountLabel") : t("countLabel")} · ${item.name}`}
                aria-invalid={!!error}
                {...{ [COUNT_INPUT_ATTRIBUTE]: "" }}
                onKeyDown={(event) => {
                  if (event.key !== ENTER) return
                  event.preventDefault()
                  void save()
                }}
              />
            </InputGroup>
            {units.length > 1 && (
              <Select
                items={units}
                value={unit}
                onValueChange={(value) => setUnit(value ?? BASE_UNIT_CHOICE)}
              >
                <SelectTrigger
                  className="w-44"
                  aria-label={`${t("unit")} · ${item.name}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              disabled={count.isPending || !typed.trim()}
              onClick={() => void save()}
              aria-label={`${t("save")} · ${item.name}`}
            >
              {count.isPending ? <Spinner /> : <CheckIcon />}
              {t("save")}
            </Button>
            {counted && (
              <Button variant="ghost" onClick={() => setMode(null)}>
                {t("cancel")}
              </Button>
            )}
          </div>
          <p className="mt-1 text-sm">
            {error && <span className="text-destructive">{error}</span>}
            {converted !== null && !error && (
              <span className="text-muted-foreground">
                = {label(converted)}
              </span>
            )}
          </p>
        </div>
      )}
    </li>
  )
}

const ENTER = "Enter"

function GapBadge({
  gap,
  label,
}: {
  gap: number
  label: (quantity: number) => string
}) {
  const t = useTranslations("inventory.line")
  if (gap === 0) return <Badge variant="success">{t("noGap")}</Badge>
  return (
    <Badge variant="warning">
      {t("gap", { quantity: `${gap > 0 ? "+" : "−"}${label(Math.abs(gap))}` })}
    </Badge>
  )
}

/** « Compté : 98 pièces (théorique 100) · Awa Bello, 10:42 ». */
function TallyText({
  tally,
  prefix,
  label,
}: {
  tally: Tally
  prefix: string
  label: (quantity: number) => string
}) {
  const t = useTranslations("inventory.line")
  const format = useFormatter()
  return (
    <p>
      <span className="font-medium text-foreground">
        {prefix} {label(tally.quantity)}
      </span>{" "}
      {t("book", { quantity: label(tally.book) })} · {tally.byName},{" "}
      {format.dateTime(new Date(tally.at), { timeStyle: "short" })}
    </p>
  )
}
