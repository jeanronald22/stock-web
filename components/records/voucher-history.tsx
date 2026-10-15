"use client"

import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"

import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DiscrepancyBadge,
  VoucherTypeBadge,
} from "@/components/vouchers/vouchers-screen"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import type { VoucherSearch, VoucherSummary } from "@/lib/api/vouchers"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

/** Derniers bons montrés sur une fiche ; la liste des bons montre le reste. */
const LATEST = 8

/**
 * Derniers bons d'une fiche (article, dépôt, fournisseur, client) : numéro, type, date, lieu ;
 * [detail] ajoute ce qui compte pour cette fiche (le mouvement d'un article, le tiers d'un dépôt).
 */
export function VoucherHistory({
  title,
  search,
  allHref,
  empty,
  detail,
}: {
  title: string
  /** Mémorisée par l'appelant (clé de cache). */
  search: VoucherSearch
  allHref: string
  empty: string
  detail?: (voucher: VoucherSummary) => React.ReactNode
}) {
  const t = useTranslations("records")
  const format = useFormatter()
  const vouchers = useVouchersPage(search, 0, LATEST)
  const rows = vouchers.data?.items ?? []
  const total = vouchers.data?.total ?? 0

  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {vouchers.isPending ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <>
          <ul className="divide-y rounded-2xl border">
            {rows.map((voucher) => (
              <li key={voucher.id}>
                <Link
                  href={RecordRoutes.voucher(voucher.id)}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 transition-colors hover:bg-muted/40"
                >
                  <span className="font-mono font-semibold">
                    {voucher.number}
                  </span>
                  <VoucherTypeBadge type={voucher.type} />
                  {voucher.hasDiscrepancy && <DiscrepancyBadge />}
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {format.dateTime(new Date(voucher.occurredAt), {
                      dateStyle: "medium",
                    })}
                    {" · "}
                    {voucher.destination
                      ? `${voucher.warehouse.name} → ${voucher.destination.name}`
                      : voucher.warehouse.name}
                  </span>
                  {detail?.(voucher)}
                </Link>
              </li>
            ))}
          </ul>
          {total > rows.length && (
            <Link
              href={allHref}
              className={cn(buttonVariants({ variant: "outline" }), "mt-3")}
            >
              {t("allVouchers", { count: total })}
            </Link>
          )}
        </>
      )}
    </section>
  )
}
