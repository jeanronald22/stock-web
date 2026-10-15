"use client"

import { ArrowRightIcon, ClipboardClockIcon } from "lucide-react"
import Link from "next/link"
import { useFormatter, useNow, useTranslations } from "next-intl"

import { buttonVariants } from "@/components/ui/button"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useRequests } from "@/lib/api/request-queries"
import { StockPermission } from "@/lib/api/stock"
import { RequestStatus } from "@/lib/api/voucher-requests"
import { RecordRoutes, Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

const MINUTE_MS = 60 * 1000

/** Demandes lues pour l'accueil ; la liste complète est dans « Bons ». */
const PREVIEW = 5

/**
 * Demandes de sortie en attente (D33) : à valider pour un responsable, en attente pour qui les a
 * préparées. Rien s'il n'y en a pas.
 */
export function RequestsCard({ className }: { className?: string }) {
  const t = useTranslations("dashboard.requests")
  const format = useFormatter()
  const now = useNow({ updateInterval: MINUTE_MS })
  const decides = useStockAccess().can(StockPermission.correctStock)
  const pending = useRequests(RequestStatus.pending, 0, PREVIEW)
  const rows = pending.data?.items ?? []
  const total = pending.data?.total ?? 0
  if (total === 0) return null

  return (
    <section
      className={cn(
        "rounded-2xl border border-warning/40 bg-warning-muted/40 p-5",
        className
      )}
      aria-labelledby="requests-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="requests-title"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <ClipboardClockIcon className="size-5" aria-hidden />
          {decides
            ? t("toDecide", { count: total })
            : t("waiting", { count: total })}
        </h2>
        <Link
          href={Routes.requests}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          {t("seeAll")}
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="mt-4 divide-y rounded-xl border bg-background">
        {rows.map((request) => (
          <li
            key={request.id}
            className="flex flex-wrap items-center gap-3 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {request.counterparty ??
                  request.destination?.name ??
                  request.warehouse.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t("line", {
                  name: request.requestedByName,
                  warehouse: request.warehouse.name,
                  count: request.lineCount,
                  date: format.relativeTime(new Date(request.requestedAt), now),
                })}
              </p>
            </div>
            <Link
              href={RecordRoutes.request(request.id)}
              className={buttonVariants({ size: "sm" })}
            >
              {decides ? t("review") : t("open")}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
