import { VoucherType, type EntryType } from "@/lib/api/vouchers"
import { Routes } from "@/lib/routes"

/** Écran de saisie de chaque type de bon (refaire une demande, reprendre une saisie hors ligne). */
export const ENTRY_ROUTES = {
  [VoucherType.receipt]: Routes.newReceipt,
  [VoucherType.issue]: Routes.newIssue,
  [VoucherType.transferOut]: Routes.newTransfer,
  [VoucherType.damage]: Routes.newDamage,
  [VoucherType.adjustment]: Routes.newAdjustment,
  [VoucherType.customerReturn]: Routes.newCustomerReturn,
  [VoucherType.supplierReturn]: Routes.newSupplierReturn,
} as const satisfies Record<EntryType, string>
