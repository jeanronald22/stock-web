import {
  TransferState,
  VoucherType,
  type VoucherSearch,
} from "@/lib/api/vouchers"

/**
 * Valeurs du filtre « type » de la liste des bons, dans l'adresse. Un transfert regroupe l'envoi
 * et sa réception ; « en transit » : les envois pas encore réceptionnés (D27) ; « écarts » : les
 * réceptions qui ne correspondent pas à l'attendu, pour le recours (D28).
 */
export const VoucherKind = {
  receipts: "receptions",
  issues: "sorties",
  transfers: "transferts",
  inTransit: "en-transit",
  damages: "casses",
  adjustments: "ajustements",
  discrepancies: "ecarts",
} as const
export type VoucherKind = (typeof VoucherKind)[keyof typeof VoucherKind]

export const VOUCHER_KIND_SEARCH: Record<
  VoucherKind,
  Pick<VoucherSearch, "types" | "transferState" | "discrepancy">
> = {
  [VoucherKind.receipts]: { types: [VoucherType.receipt] },
  [VoucherKind.issues]: { types: [VoucherType.issue] },
  [VoucherKind.transfers]: {
    types: [VoucherType.transferOut, VoucherType.transferIn],
  },
  [VoucherKind.inTransit]: { transferState: TransferState.inTransit },
  [VoucherKind.damages]: { types: [VoucherType.damage] },
  [VoucherKind.adjustments]: { types: [VoucherType.adjustment] },
  [VoucherKind.discrepancies]: { discrepancy: true },
}
