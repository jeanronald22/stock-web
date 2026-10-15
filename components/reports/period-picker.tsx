"use client"

import { CalendarRangeIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PeriodPreset,
  presetOf,
  presetPeriod,
  type Period,
} from "@/lib/reports/periods"

/** Choix « dates libres » du sélecteur. */
const CUSTOM = "custom"

/**
 * Période d'un rapport : un raccourci (7 jours, ce mois…) ou des dates libres. Les dates
 * s'affichent dès qu'on choisit « dates libres », ou quand la période n'est pas un raccourci.
 */
export function PeriodPicker({
  period,
  onChange,
}: {
  period: Period
  onChange: (period: Period) => void
}) {
  const t = useTranslations("reports.period")
  // « Dates libres » choisi sur un raccourci : les dates s'ouvrent, à partir de ce raccourci.
  const [custom, setCustom] = useState(false)
  const matched = presetOf(period)
  const preset = custom ? null : matched
  const choices = [
    ...Object.values(PeriodPreset).map((value) => ({
      value,
      label: t(`presets.${value}`),
    })),
    { value: CUSTOM, label: t("custom") },
  ]
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Select
        items={choices}
        value={preset ?? CUSTOM}
        onValueChange={(value) => {
          const chosen = Object.values(PeriodPreset).find(
            (candidate) => candidate === value
          )
          setCustom(!chosen)
          if (chosen) onChange(presetPeriod(chosen))
        }}
      >
        <SelectTrigger className="h-11 w-full sm:w-52" aria-label={t("label")}>
          <CalendarRangeIcon className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {preset === null && (
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <InputGroup className="h-11 sm:w-44">
            <InputGroupAddon>
              <InputGroupText>{t("from")}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              type="date"
              value={period.from}
              max={period.to}
              aria-label={t("fromLabel")}
              onChange={(event) =>
                event.target.value &&
                onChange({ ...period, from: event.target.value })
              }
            />
          </InputGroup>
          <InputGroup className="h-11 sm:w-44">
            <InputGroupAddon>
              <InputGroupText>{t("to")}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              type="date"
              value={period.to}
              min={period.from}
              aria-label={t("toLabel")}
              onChange={(event) =>
                event.target.value &&
                onChange({ ...period, to: event.target.value })
              }
            />
          </InputGroup>
        </div>
      )}
    </div>
  )
}
