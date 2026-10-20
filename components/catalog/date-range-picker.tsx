"use client"

import { CalendarRangeIcon, ChevronDownIcon } from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { enUS, fr } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import type { AppLocale } from "@/i18n/locales"
import {
  isoDay,
  PeriodPreset,
  presetOf,
  presetPeriod,
} from "@/lib/reports/periods"
import { cn } from "@/lib/utils"

const CALENDAR_LOCALES = { fr, en: enUS } satisfies Record<AppLocale, unknown>

/** Midi : un changement d'heure ne fait jamais glisser le jour. */
function dayDate(day: string): Date {
  return new Date(`${day}T12:00:00`)
}

/** Sur deux mois, le second est celui de la fin de période : le premier le précède. */
function firstMonth(range: DateRange | undefined, months: number): Date {
  const anchor = range?.to ?? range?.from ?? new Date()
  return new Date(anchor.getFullYear(), anchor.getMonth() - (months - 1), 1)
}

/**
 * Période en jours inclus (AAAA-MM-JJ) : un raccourci s'applique aussitôt ; des dates libres se
 * choisissent sur le calendrier, puis « Appliquer ». Une seule date choisie : ce jour-là. Pas de
 * date dans le futur : rien ne s'y est encore passé.
 */
export function DateRangePicker({
  from,
  to,
  onChange,
  label,
  clearable = false,
  className,
}: {
  from: string | undefined
  to: string | undefined
  onChange: (from: string | undefined, to: string | undefined) => void
  /** Ce que la période borne : « Période », « Période des bons ». */
  label: string
  /** Propose « Effacer » : sans période, la liste n'est pas bornée. */
  clearable?: boolean
  className?: string
}) {
  const t = useTranslations("period")
  const format = useFormatter()
  const locale = useLocale() as AppLocale
  const months = useIsMobile() ? 1 : 2
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>()

  // Une seule borne posée (adresse modifiée à la main) : la période est ce jour-là.
  const start = from ?? to
  const end = to ?? from
  const preset = start && end ? presetOf({ from: start, to: end }) : null
  const span = (first: Date, last: Date) =>
    format.dateTimeRange(first, last, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  const value = preset
    ? t(`presets.${preset}`)
    : start && end
      ? span(dayDate(start), dayDate(end))
      : t("any")

  // À l'ouverture, le calendrier part de la période affichée.
  const toggle = (next: boolean) => {
    if (next)
      setDraft(
        start && end ? { from: dayDate(start), to: dayDate(end) } : undefined
      )
    setOpen(next)
  }
  const apply = (first: string | undefined, last: string | undefined) => {
    onChange(first, last)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={toggle}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "justify-start font-normal",
              start && clearable && "border-primary/50 bg-primary/5",
              className
            )}
            aria-label={t("trigger", { label, value })}
          />
        }
      >
        <CalendarRangeIcon
          className="size-5 text-muted-foreground"
          aria-hidden
        />
        <span className="truncate">{value}</span>
        <ChevronDownIcon
          className="ml-auto size-4 text-muted-foreground"
          aria-hidden
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 md:flex-row"
        aria-label={label}
      >
        <div className="flex gap-1 overflow-x-auto border-b p-2 md:w-44 md:flex-col md:border-r md:border-b-0">
          {Object.values(PeriodPreset).map((choice) => (
            <Button
              key={choice}
              variant="ghost"
              size="sm"
              aria-pressed={choice === preset}
              className="shrink-0 justify-start font-normal aria-pressed:bg-primary/10 aria-pressed:text-primary"
              onClick={() => {
                const period = presetPeriod(choice)
                apply(period.from, period.to)
              }}
            >
              {t(`presets.${choice}`)}
            </Button>
          ))}
        </div>
        <div className="flex flex-col">
          <Calendar
            mode="range"
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={months}
            defaultMonth={firstMonth(draft, months)}
            disabled={{ after: new Date() }}
            locale={CALENDAR_LOCALES[locale]}
          />
          <div className="flex items-center gap-2 border-t p-3">
            <p
              className={cn(
                "mr-auto text-xs text-muted-foreground",
                draft?.from && "num"
              )}
            >
              {draft?.from
                ? span(draft.from, draft.to ?? draft.from)
                : t("pick")}
            </p>
            {clearable && start && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apply(undefined, undefined)}
              >
                {t("clear")}
              </Button>
            )}
            <Button
              size="sm"
              disabled={!draft?.from}
              onClick={() =>
                draft?.from &&
                apply(isoDay(draft.from), isoDay(draft.to ?? draft.from))
              }
            >
              {t("apply")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
