"use client"

import {
  CheckCircle2Icon,
  DownloadIcon,
  FileSpreadsheetIcon,
  UploadIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { IMPORT_FIELDS, REQUIRED_FIELDS } from "@/lib/import/import-fields"
import { downloadWorkbook } from "@/lib/import/import-files"
import {
  IMPORT_FILE_ACCEPT,
  MAX_IMPORT_ROWS,
  readTable,
  TableError,
  TableErrorCode,
  type Table,
  type TableCell,
} from "@/lib/import/read-table"
import { cn } from "@/lib/utils"

const TEMPLATE_FILE = "modele-articles.xlsx"

/** Fichier choisi et lu ; [table] null tant qu'aucun fichier n'est lu. */
export type ChosenFile = { name: string; table: Table }

/**
 * Choix du fichier : glissé ou choisi, lu sur place (rien n'est envoyé avant la vérification).
 * Le modèle donne les colonnes attendues, avec deux exemples.
 */
export function ImportFileStep({
  chosen,
  onChosen,
  error,
}: {
  chosen: ChosenFile | null
  onChosen: (file: ChosenFile) => void
  /** Continuer sans fichier : on le rappelle. */
  error: string | null
}) {
  const t = useTranslations("import.file")
  const tFields = useTranslations("import.fields")
  const input = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)
  const [failure, setFailure] = useState<TableErrorCode | null>(null)
  const [dragging, setDragging] = useState(false)

  const read = async (file: File | undefined) => {
    if (!file) return
    setReading(true)
    setFailure(null)
    try {
      onChosen({ name: file.name, table: await readTable(file) })
    } catch (caught) {
      setFailure(
        caught instanceof TableError ? caught.code : TableErrorCode.unreadable
      )
    } finally {
      setReading(false)
    }
  }

  const downloadTemplate = () =>
    void downloadWorkbook(
      TEMPLATE_FILE,
      IMPORT_FIELDS.map((field) => tFields(`${field}.label`)),
      (t.raw("examples") as Record<string, TableCell>[]).map((example) =>
        IMPORT_FIELDS.map((field) => example[field] ?? null)
      )
    )

  const message = failure
    ? t(`errors.${failure}`, { max: MAX_IMPORT_ROWS })
    : error

  return (
    <div className="space-y-6">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          void read(event.dataTransfer.files[0])
        }}
        className={cn(
          "flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border",
          message && "border-destructive/50"
        )}
      >
        {chosen ? (
          <CheckCircle2Icon className="size-9 text-primary" aria-hidden />
        ) : (
          <FileSpreadsheetIcon
            className="size-9 text-muted-foreground"
            aria-hidden
          />
        )}
        <p className="mt-3 font-semibold">{chosen ? chosen.name : t("drop")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {chosen
            ? t("rows", { count: chosen.table.rows.length })
            : t("formats")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={reading}
          onClick={() => input.current?.click()}
        >
          {reading ? <Spinner /> : <UploadIcon />}
          {chosen ? t("change") : t("choose")}
        </Button>
        <input
          ref={input}
          type="file"
          accept={IMPORT_FILE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label={t("choose")}
          onChange={(event) => {
            void read(event.target.files?.[0])
            event.target.value = ""
          }}
        />
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="rounded-2xl bg-muted/50 p-4">
        <p className="text-sm font-semibold">{t("columnsTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("columns", {
            required: [...REQUIRED_FIELDS]
              .map((field) => tFields(`${field}.label`))
              .join(", "),
          })}
        </p>
        <Button
          type="button"
          variant="link"
          className="mt-1 h-auto px-0"
          onClick={downloadTemplate}
        >
          <DownloadIcon />
          {t("downloadTemplate")}
        </Button>
      </div>
    </div>
  )
}
