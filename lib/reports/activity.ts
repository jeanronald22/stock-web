import type { DayActivity } from "@/lib/api/reports"
import { VoucherType } from "@/lib/api/vouchers"

import { isoDay } from "./periods"

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

/** Point de la courbe : [day] est le premier jour du jour, de la semaine ou du mois compté. */
export type ActivityPoint = { day: string; inbound: number; outbound: number }

/** Pas de la courbe d'activité. */
export const ActivityStep = {
  day: "day",
  week: "week",
  month: "month",
} as const
export type ActivityStep = (typeof ActivityStep)[keyof typeof ActivityStep]

/** Au-delà, une barre par jour devient illisible : une par semaine, puis une par mois. */
const DAYS_PER_DAY_STEP = 31
const DAYS_PER_WEEK_STEP = 120

export function activityStep(days: number): ActivityStep {
  if (days <= DAYS_PER_DAY_STEP) return ActivityStep.day
  if (days <= DAYS_PER_WEEK_STEP) return ActivityStep.week
  return ActivityStep.month
}

const MONDAY = 1

/** Premier jour de la semaine (lundi) ou du mois qui contient [day] (AAAA-MM-JJ). */
function bucketOf(day: string, step: ActivityStep): string {
  if (step === ActivityStep.day) return day
  if (step === ActivityStep.month) return `${day.slice(0, 7)}-01`
  // Midi : un changement d'heure ne fait jamais glisser le jour.
  const date = new Date(`${day}T12:00:00`)
  date.setDate(date.getDate() - ((date.getDay() - MONDAY + 7) % 7))
  return isoDay(date)
}

const countOf = (
  counts: Partial<Record<VoucherType, number>>,
  types: readonly VoucherType[]
) => types.reduce((sum, type) => sum + (counts[type] ?? 0), 0)

export function activitySeries(
  activity: DayActivity[],
  step: ActivityStep = ActivityStep.day
): ActivityPoint[] {
  const points = new Map<string, ActivityPoint>()
  for (const { day, counts } of activity) {
    const key = bucketOf(day, step)
    const point = points.get(key) ?? { day: key, inbound: 0, outbound: 0 }
    point.inbound += countOf(counts, INBOUND_TYPES)
    point.outbound += countOf(counts, OUTBOUND_TYPES)
    points.set(key, point)
  }
  return [...points.values()]
}

export function totalOf(
  totals: Partial<Record<VoucherType, number>>,
  types: readonly VoucherType[]
): number {
  return countOf(totals, types)
}
