"use client"

import {
  ArrowDownRightIcon,
  ArrowRightIcon,
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
const TONE_COLORS: Record<StatTone, string> = {
  [StatTone.neutral]: "text-muted-foreground",
  [StatTone.good]: "text-primary",
  [StatTone.warning]: "text-warning",
  [StatTone.bad]: "text-destructive",
}

const STAT_COLUMNS = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const

/**
 * Chiffres côte à côte, en un seul bloc séparé par des filets. Sur téléphone, deux par ligne ; un
 * dernier chiffre seul prend toute la ligne plutôt que de laisser une case vide.
 */
export function StatGrid({
  columns,
  className,
  ...props
}: {
  columns: keyof typeof STAT_COLUMNS
} & React.ComponentProps<"dl">) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1",
        STAT_COLUMNS[columns],
        className
      )}
      {...props}
    />
  )
}

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
        <span className="label-caps">{label}</span>
        <Icon
          className={cn("size-4 shrink-0", TONE_COLORS[tone])}
          aria-hidden
        />
      </div>
      <p className="mt-3 num text-3xl font-semibold">{value}</p>
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
  const className = "flex flex-col bg-card p-4 transition-colors sm:p-5"
  return href ? (
    <Link
      href={href}
      className={cn(
        className,
        "hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none focus-visible:ring-inset"
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

/**
 * Carte du tableau de bord (D43) : un titre, ce qu'elle montre, et au besoin un lien vers le
 * détail (un rapport, la liste filtrée).
 */
export function BoardCard({
  title,
  description,
  link,
  children,
  className,
}: {
  title: string
  description?: string
  link?: { href: string; label: string }
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("flex flex-col rounded-2xl border p-4 sm:p-5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {link && (
          <Link
            href={link.href}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {link.label}
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </div>
  )
}

/** Couleur d'une barre de classement. */
const BAR_TONES: Record<StatTone, string> = {
  [StatTone.neutral]: "bg-chart-4",
  [StatTone.good]: "bg-primary",
  [StatTone.warning]: "bg-warning",
  [StatTone.bad]: "bg-destructive",
}

/**
 * Ligne d'un classement : ce qui est classé, sa valeur, puis une barre dont la longueur est relative
 * au premier ([share], de 0 à 1).
 */
export function RankedRow({
  label,
  value,
  detail,
  share,
  tone = StatTone.neutral,
}: {
  label: React.ReactNode
  value: React.ReactNode
  detail?: React.ReactNode
  share: number
  tone?: StatTone
}) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium">{label}</span>
        <span className="shrink-0 num text-muted-foreground">{value}</span>
      </div>
      {detail && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {detail}
        </p>
      )}
      <div className="mt-1.5 h-1.5 rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", BAR_TONES[tone])}
          style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
        />
      </div>
    </li>
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
