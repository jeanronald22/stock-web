"use client"

import { useTranslations } from "next-intl"

import { ChoiceCard } from "@/components/catalog/choice-card"
import {
  LABEL_FORMATS,
  labelsPerPage,
  type LabelFormat,
  type LabelFormatId,
} from "@/lib/labels/label-formats"
import { cn } from "@/lib/utils"

/** Format des étiquettes : deux planches A4 du commerce, ou un rouleau d'imprimante thermique. */
export function LabelFormatPicker({
  value,
  onChange,
}: {
  value: LabelFormatId
  onChange: (format: LabelFormatId) => void
}) {
  const t = useTranslations("labels.formats")
  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1"
    >
      {Object.values(LABEL_FORMATS).map((format) => (
        <ChoiceCard
          key={format.id}
          selected={format.id === value}
          label={t(`${format.id}.label`)}
          hint={t(`${format.id}.hint`)}
          onSelect={() => onChange(format.id)}
        />
      ))}
    </div>
  )
}

/**
 * Planche déjà entamée : on touche la première étiquette libre, celles d'avant restent vides.
 * Dessinée à l'échelle de la planche, pour la reconnaître d'un coup d'œil.
 */
export function SheetStartPicker({
  format,
  skip,
  onChange,
}: {
  format: LabelFormat
  skip: number
  onChange: (skip: number) => void
}) {
  const t = useTranslations("labels.start")
  return (
    <div className="flex items-start gap-4">
      <div
        className="grid w-28 shrink-0 gap-0.5 rounded-md border bg-background p-1 shadow-xs"
        style={{
          gridTemplateColumns: `repeat(${format.columns}, minmax(0, 1fr))`,
          aspectRatio: `${format.page.width} / ${format.page.height}`,
        }}
      >
        {Array.from({ length: labelsPerPage(format) }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={t("slot", { number: index + 1 })}
            aria-pressed={index === skip}
            onClick={() => onChange(index)}
            className={cn(
              "rounded-[2px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              index < skip
                ? "bg-muted-foreground/25"
                : index === skip
                  ? "bg-primary"
                  : "bg-primary/15 hover:bg-primary/40"
            )}
          />
        ))}
      </div>
      <div className="text-sm">
        <p className="font-medium">{t("title", { number: skip + 1 })}</p>
        <p className="mt-1 text-muted-foreground">{t("hint")}</p>
      </div>
    </div>
  )
}
