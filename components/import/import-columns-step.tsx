"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IMPORT_FIELDS,
  REQUIRED_FIELDS,
  type ColumnMapping,
  type ImportField,
} from "@/lib/import/import-fields"
import { cellText, type Table } from "@/lib/import/read-table"

/** Choix « ne pas importer » d'un champ. */
const SKIPPED = "skip"

/**
 * Colonnes du fichier pour chaque champ : reconnues d'après leurs titres, ajustables. Chaque champ
 * montre une valeur du fichier, pour vérifier d'un coup d'œil.
 */
export function ImportColumnsStep({
  table,
  mapping,
  onChange,
}: {
  table: Table
  mapping: ColumnMapping
  onChange: (mapping: ColumnMapping) => void
}) {
  const t = useTranslations("import.columns")
  const tFields = useTranslations("import.fields")
  const columns = table.headers.map((header, index) => ({
    value: String(index),
    label: header || t("untitled", { number: index + 1 }),
  }))
  const choices = [{ value: SKIPPED, label: t("skip") }, ...columns]
  const sample = (column: number | null) =>
    column === null
      ? null
      : table.rows.map((row) => cellText(row[column] ?? null)).find(Boolean)

  const choose = (field: ImportField, value: string | null) => {
    const column = value === null || value === SKIPPED ? null : Number(value)
    // Une colonne ne sert qu'à un champ : la reprendre la retire de l'autre.
    const next = Object.fromEntries(
      IMPORT_FIELDS.map((other) => [
        other,
        other === field
          ? column
          : mapping[other] === column
            ? null
            : mapping[other],
      ])
    ) as ColumnMapping
    onChange(next)
  }

  return (
    <ul className="divide-y rounded-2xl border">
      {IMPORT_FIELDS.map((field) => {
        const column = mapping[field]
        const example = sample(column)
        const id = `import-column-${field}`
        return (
          <li
            key={field}
            className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-4"
          >
            <div className="min-w-0">
              <label
                htmlFor={id}
                className="flex items-center gap-2 font-medium"
              >
                {tFields(`${field}.label`)}
                {REQUIRED_FIELDS.has(field) && (
                  <Badge variant="secondary">{t("required")}</Badge>
                )}
              </label>
              <p className="truncate text-sm text-muted-foreground">
                {example
                  ? t("example", { value: example })
                  : tFields(`${field}.hint`)}
              </p>
            </div>
            <Select
              items={choices}
              value={column === null ? SKIPPED : String(column)}
              onValueChange={(value) => choose(field, value)}
            >
              <SelectTrigger id={id} className="w-full">
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
          </li>
        )
      })}
    </ul>
  )
}
