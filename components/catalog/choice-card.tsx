"use client"

import { cn } from "@/lib/utils"

/** Carte de choix, même dessin que les unités de comptage et les types de dépôt. */
export function ChoiceCard({
  selected,
  label,
  hint,
  onSelect,
  disabled,
}: {
  selected: boolean
  label: string
  hint: string
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-3 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:border-foreground/20 hover:bg-muted/40"
      )}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
    </button>
  )
}
