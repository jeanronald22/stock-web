import type { DayActivity } from "@/lib/api/reports"
import { VoucherType } from "@/lib/api/vouchers"

/** Bons qui font entrer de la marchandise dans le dépôt. */
export const INBOUND_TYPES: readonly VoucherType[] = [
  VoucherType.receipt,
  VoucherType.customerReturn,
  VoucherType.transferIn,
]

/**
 * Bons qui en font sortir. La casse se compte à part (elle a sa tuile) ; les ajustements ne sont
 * ni des entrées ni des sorties.
 */
export const OUTBOUND_TYPES: readonly VoucherType[] = [
  VoucherType.issue,
  VoucherType.supplierReturn,
  VoucherType.transferOut,
]

export type ActivityPoint = { day: string; inbound: number; outbound: number }

const countOf = (
  counts: Partial<Record<VoucherType, number>>,
  types: readonly VoucherType[]
) => types.reduce((sum, type) => sum + (counts[type] ?? 0), 0)

export function activitySeries(activity: DayActivity[]): ActivityPoint[] {
  return activity.map(({ day, counts }) => ({
    day,
    inbound: countOf(counts, INBOUND_TYPES),
    outbound: countOf(counts, OUTBOUND_TYPES),
  }))
}

export function totalOf(
  totals: Partial<Record<VoucherType, number>>,
  types: readonly VoucherType[]
): number {
  return countOf(totals, types)
}
