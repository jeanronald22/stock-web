"use client"

import { useTranslations } from "next-intl"

import {
  StatusTabs,
  StatusTone,
  type StatusTab,
} from "@/components/catalog/status-tabs"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import type { VoucherSearch } from "@/lib/api/vouchers"
import { VOUCHER_KIND_SEARCH, VoucherKind } from "@/lib/vouchers/voucher-kinds"

/** Valeur de l'onglet « Tous » : distincte de toute sorte de bon. */
export const ALL_KINDS = "all"
type KindTab = VoucherKind | typeof ALL_KINDS

/** Bons qui attendent un geste : leur nombre se voit sur l'onglet. */
const ATTENTION_KINDS: readonly VoucherKind[] = [
  VoucherKind.inTransit,
  VoucherKind.discrepancies,
]
/** Seul le total compte : une ligne suffit. */
const COUNT_PAGE_SIZE = 1

function useKindCount(search: VoucherSearch, kind: VoucherKind) {
  return useVouchersPage(
    { ...search, ...VOUCHER_KIND_SEARCH[kind] },
    0,
    COUNT_PAGE_SIZE
  ).data?.total
}

/**
 * Sortes de bons en onglets. « En route » et « Avec écart » portent leur nombre (dans les dépôts et
 * la période choisis) : ce sont ceux qu'il reste à traiter.
 */
export function VoucherKindTabs({
  search,
  value,
  onChange,
}: {
  /** Filtres posés, hors sorte de bon. */
  search: VoucherSearch
  value: VoucherKind | undefined
  onChange: (kind: VoucherKind | undefined) => void
}) {
  const t = useTranslations("vouchers")
  const inTransit = useKindCount(search, VoucherKind.inTransit)
  const discrepancies = useKindCount(search, VoucherKind.discrepancies)
  const counts: Partial<Record<VoucherKind, number | undefined>> = {
    [VoucherKind.inTransit]: inTransit,
    [VoucherKind.discrepancies]: discrepancies,
  }

  const tabs: StatusTab<KindTab>[] = [
    { value: ALL_KINDS, label: t("allKinds") },
    ...Object.entries(VoucherKind).map(([key, kind]) => {
      const attention = ATTENTION_KINDS.includes(kind)
      return {
        value: kind,
        label: t(`kinds.${key as keyof typeof VoucherKind}`),
        // Rien à traiter : pas de « 0 » qui attire l'œil pour rien.
        count: attention ? counts[kind] || undefined : undefined,
        tone: attention ? StatusTone.warning : StatusTone.neutral,
      }
    }),
  ]
  return (
    <StatusTabs
      label={t("kindsLabel")}
      tabs={tabs}
      value={value ?? ALL_KINDS}
      onChange={(next) =>
        onChange(Object.values(VoucherKind).find((kind) => kind === next))
      }
    />
  )
}
