"use client"

import { DownloadIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { RecordRoutes } from "@/lib/routes"

import { ImportPhase, type ImportReport } from "./use-item-import"

/**
 * Avancement puis bilan : articles importés, stock de départ (avec ses bons), lignes refusées par
 * le catalogue, à télécharger pour les corriger.
 */
export function ImportResultStep({
  phase,
  progress,
  report,
  error,
  serverReason,
  onDownloadRejected,
}: {
  phase: ImportPhase
  progress: { done: number; total: number }
  report: ImportReport
  error: unknown
  /** Texte d'un refus de l'API, d'après son code. */
  serverReason: (code: string) => string
  onDownloadRejected: () => void
}) {
  const t = useTranslations("import.result")
  const errorMessage = useErrorMessage()
  const percent =
    progress.total === 0
      ? 0
      : Math.round((progress.done / progress.total) * 100)

  if (phase !== ImportPhase.done)
    return (
      <div className="space-y-4">
        <Progress value={percent} aria-label={t("progressLabel")} />
        <p className="text-sm tabular-nums" aria-live="polite">
          {t("progress", { done: progress.done, total: progress.total })}
        </p>
        {phase === ImportPhase.interrupted ? (
          <p
            role="alert"
            className="flex gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm"
          >
            <TriangleAlertIcon
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden
            />
            <span>
              {errorMessage(error)} {t("resumeHint")}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("keepOpen")}</p>
        )}
      </div>
    )

  return (
    <div className="space-y-6">
      {report.openings.length > 0 && (
        <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <p>{t("opening", { count: report.openings.length })}</p>
          <p className="mt-1 flex flex-wrap gap-x-3">
            {report.openings.map((voucher) => (
              <Link
                key={voucher.id}
                href={RecordRoutes.voucher(voucher.id)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {voucher.number}
              </Link>
            ))}
          </p>
        </div>
      )}
      {report.openingCodes.length > 0 && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm"
        >
          {t("openingFailed", {
            reasons: report.openingCodes.map(serverReason).join(" ; "),
          })}
        </p>
      )}
      {report.rejected.length > 0 && (
        <section aria-labelledby="import-rejected" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="import-rejected" className="font-semibold">
              {t("rejected.title", { count: report.rejected.length })}
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={onDownloadRejected}
            >
              <DownloadIcon />
              {t("rejected.download")}
            </Button>
          </div>
          <ul className="divide-y rounded-2xl border text-sm">
            {report.rejected.map(({ row, code }) => (
              <li key={row.line} className="flex gap-3 px-4 py-2.5">
                <span className="w-16 shrink-0 text-muted-foreground tabular-nums">
                  {t("line", { line: row.line })}
                </span>
                <span className="min-w-0">
                  <span className="font-medium">{row.item.name}</span>
                  <span className="text-destructive">
                    {" · "}
                    {serverReason(code)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
