"use client"

import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  DownloadIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useQuantityLabel } from "@/components/items/describe"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { BaseUnit } from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { cn } from "@/lib/utils"

/** Couleur d'un chiffre : neutre, ce qui va bien, ce qui demande d'agir. */
export const StatTone = {
  neutral: "neutral",
  good: "good",
  warning: "warning",
  bad: "bad",
} as const
export type StatTone = (typeof StatTone)[keyof typeof StatTone]

/** Variation par rapport à la période précédente, en pourcentage arrondi ; null sans base. */
export function changeOf(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Un chiffre de la période, en grand, avec ce qu'il compte et, au besoin, sa variation. Toute la
 * tuile mène au détail ([href]).
 */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = StatTone.neutral,
  change,
  href,
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: StatTone
  /** Variation en % sur la période précédente. */
  change?: number | null
  href?: string
}) {
  const t = useTranslations("reports.stat")
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone === StatTone.good && "bg-primary/10 text-primary",
            tone === StatTone.warning &&
              "bg-warning-muted text-warning-muted-foreground",
            tone === StatTone.bad && "bg-destructive/10 text-destructive",
            tone === StatTone.neutral && "bg-muted text-muted-foreground"
          )}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        {change !== undefined && change !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              change >= 0 ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {change >= 0 ? (
              <ArrowUpRightIcon className="size-3.5" aria-hidden />
            ) : (
              <ArrowDownRightIcon className="size-3.5" aria-hidden />
            )}
            {t("change", { change })}
          </span>
        )}
        {hint && <span>{hint}</span>}
      </p>
    </>
  )
  const className =
    "flex flex-col rounded-2xl border bg-card p-4 transition-colors sm:p-5"
  return href ? (
    <Link
      href={href}
      className={cn(
        className,
        "hover:border-foreground/20 hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

/** Un bloc de rapport : titre, ce qu'il montre, puis son contenu. */
export function ReportSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const id = `report-${title.replace(/\W+/g, "-").toLowerCase()}`
  return (
    <section aria-labelledby={id} className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={id} className="text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** Rien sur la période : on le dit, sans tableau vide. */
export function ReportEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

/** Quantité d'un rapport : « — » pour zéro, qui se lit mieux qu'un « 0 pièce » répété. */
export function useReportQuantity() {
  const quantityLabel = useQuantityLabel()
  return useCallback(
    (unit: BaseUnit, value: number, signed = false) => {
      if (value === 0) return "—"
      const label = quantityLabel(unit, Math.abs(value))
      if (!signed) return label
      return `${value > 0 ? "+" : "−"} ${label}`
    },
    [quantityLabel]
  )
}

/** Export Excel du rapport ouvert ; la bibliothèque n'est chargée qu'au premier export. */
/** Un export à la fois ; un échec s'affiche en message, jamais en silence. */
export function useExport(onExport: () => Promise<void>) {
  const errorMessage = useErrorMessage()
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      await onExport()
    } catch (failure) {
      toast.error(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }
  return { busy, run }
}

export function ExportButton({
  onExport,
  disabled,
}: {
  onExport: () => Promise<void>
  disabled?: boolean
}) {
  const t = useTranslations("reports")
  const exporter = useExport(onExport)
  return (
    <Button
      variant="outline"
      size="lg"
      disabled={disabled || exporter.busy}
      onClick={() => void exporter.run()}
    >
      {exporter.busy ? <Spinner /> : <DownloadIcon />}
      {t("exportButton")}
    </Button>
  )
}
