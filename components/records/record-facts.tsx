"use client"

import type { ReactNode } from "react"

export type RecordFact = { label: string; value: ReactNode }

/**
 * Colonne « Fiche » d'une fiche : ce qui décrit la chose, en lecture. Un fait vide n'est pas
 * affiché ; la note, s'il y en a une, vient en dernier.
 */
export function RecordFacts({
  title,
  facts,
  note,
}: {
  title: string
  /** Un fait absent (vide, faux, null) est simplement omis. */
  facts: (RecordFact | false | null | undefined | "")[]
  note?: string | null
}) {
  const shown = facts.filter((fact): fact is RecordFact => !!fact)
  return (
    <aside
      aria-label={title}
      className="rounded-2xl border p-5 lg:sticky lg:top-20"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <dl className="mt-3 space-y-3">
        {shown.map((fact) => (
          <div key={fact.label}>
            <dt className="text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="mt-0.5 font-medium break-words">{fact.value}</dd>
          </div>
        ))}
      </dl>
      {note && (
        <p className="mt-4 border-t pt-4 text-sm whitespace-pre-line text-muted-foreground">
          {note}
        </p>
      )}
    </aside>
  )
}
