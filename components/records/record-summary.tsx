import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Bandeau sous le titre d'une fiche (article, dépôt, fournisseur, client) : de quoi la reconnaître,
 * le chiffre qui la résume, et ce qui demande d'agir. Commun aux fiches pour qu'elles se lisent
 * toutes de la même façon.
 */
export function RecordSummary({
  label,
  visual,
  aside,
  children,
  className,
}: {
  label: string
  /** Photo de l'article, ou RecordSummaryIcon. */
  visual: React.ReactNode
  /** À droite : un appel, une alerte à traiter. */
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 border-b pb-6 sm:gap-x-8",
        className
      )}
    >
      {visual}
      <div className="min-w-0 flex-1">
        <p className="label-caps">{label}</p>
        {children}
      </div>
      {aside}
    </section>
  )
}

export function RecordSummaryIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-20"
      aria-hidden
    >
      <Icon className="size-7 sm:size-8" />
    </span>
  )
}

/** Le chiffre du bandeau et son unité : « 102 pièces », « 2 articles ». */
export function RecordSummaryFigure({
  value,
  unit,
}: {
  value: React.ReactNode
  unit?: React.ReactNode
}) {
  return (
    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="num text-3xl font-semibold sm:text-4xl">{value}</span>
      {unit && <span className="text-muted-foreground">{unit}</span>}
    </p>
  )
}
