"use client"

import { Undo2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { VoucherHistory } from "@/components/records/voucher-history"
import {
  returnOrigins,
  VoucherType,
  type ReturnVoucherType,
  type VoucherSearch,
} from "@/lib/api/vouchers"
import { EntryQueryParams, ListQueryParams, Routes } from "@/lib/routes"
import { ENTRY_ROUTES } from "@/lib/vouchers/entry-routes"
import { VoucherKind } from "@/lib/vouchers/voucher-kinds"

/** Filtre de la liste des bons pour le type du bon d'origine. */
const ORIGIN_KINDS = {
  [VoucherType.customerReturn]: VoucherKind.issues,
  [VoucherType.supplierReturn]: VoucherKind.receipts,
} as const satisfies Record<ReturnVoucherType, VoucherKind>

/**
 * Bons dont un retour peut partir (D31, D50) : les dernières sorties (retour client) ou réceptions
 * (retour fournisseur), du tiers choisi s'il y en a un. Un clic ouvre le retour depuis ce bon : le
 * tiers et ce qui reste à retourner sont repris.
 */
export function ReturnOriginPicker({
  type,
  partyId,
  partyName,
}: {
  type: ReturnVoucherType
  /** Client (retour client) ou fournisseur (retour fournisseur) de l'annuaire. */
  partyId?: string
  partyName?: string
}) {
  const t = useTranslations("vouchers.returns.pick")
  const customer = type === VoucherType.customerReturn
  const search = useMemo<VoucherSearch>(
    () => ({
      types: [returnOrigins[type]],
      ...(partyId
        ? customer
          ? { customerId: partyId }
          : { supplierId: partyId }
        : {}),
    }),
    [type, partyId, customer]
  )
  const all = new URLSearchParams({
    [ListQueryParams.voucherType]: ORIGIN_KINDS[type],
  })
  if (partyId)
    all.set(
      customer ? ListQueryParams.customer : ListQueryParams.supplier,
      partyId
    )
  return (
    <VoucherHistory
      title={
        partyName
          ? t(`${type}.ofParty`, { name: partyName })
          : t(`${type}.latest`)
      }
      search={search}
      empty={t(`${type}.none`)}
      allHref={`${Routes.vouchers}?${all.toString()}`}
      hrefOf={(voucher) =>
        `${ENTRY_ROUTES[type]}?${EntryQueryParams.origin}=${voucher.id}`
      }
      detail={(voucher) => (
        <>
          {/* Sans tiers choisi, son nom aide à retrouver le bon. */}
          {!partyId && voucher.counterparty && (
            <span className="max-w-48 truncate text-sm">
              {voucher.counterparty}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            <Undo2Icon className="size-4" aria-hidden />
            {t("start")}
          </span>
        </>
      )}
    />
  )
}
