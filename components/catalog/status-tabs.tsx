"use client"

import { cn } from "@/lib/utils"

/** Un état qui demande d'agir porte son nombre en couleur : à surveiller, ou urgent. */
export const StatusTone = {
  neutral: "neutral",
  warning: "warning",
  danger: "danger",
} as const

const TONE_COUNTS: Record<StatusTone, string> = {
  [StatusTone.neutral]: "opacity-70",
  [StatusTone.warning]:
    "rounded-full bg-warning/15 px-1.5 text-warning-muted-foreground",
  [StatusTone.danger]: "rounded-full bg-destructive/10 px-1.5 text-destructive",
}
export type StatusTone = (typeof StatusTone)[keyof typeof StatusTone]

export type StatusTab<T extends string> = {
  value: T
  label: string
  /** Absent : pas encore chargé, ou rien à compter. */
  count?: number
  tone?: StatusTone
}

/**
 * Premier tri d'une liste, en onglets : on voit d'un coup combien il y en a de chaque sorte, et on
 * passe de l'une à l'autre d'un geste. Sur téléphone, la rangée défile.
 */
export function StatusTabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  className,
}: {
  label: string
  tabs: StatusTab<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "-mx-4 mt-6 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0",
        className
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value
        const tone = tab.count
          ? (tab.tone ?? StatusTone.neutral)
          : StatusTone.neutral
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
              selected
                ? "border-primary/40 bg-primary/10 font-medium text-primary"
                : "bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn("num text-xs", TONE_COUNTS[tone])}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
