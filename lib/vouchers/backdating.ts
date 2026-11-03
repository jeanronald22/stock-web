import { StockRole, type MyStockAccess } from "@/lib/api/stock"

/** Bornes du réglage « date des bons » (stock-api, StockSettingsView.MAX_BACKDATE_DAYS). */
export const BackdateLimits = { min: 0, max: 365 } as const

const DAY_MS = 86_400_000

/** [day] (AAAA-MM-JJ) décalé de [days] jours, sans passer par le fuseau de l'appareil. */
export function shiftDay(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10)
}

/**
 * Premier jour où un bon peut être daté (D50) : [backdateDays] jours avant [today], sauf pour un
 * gérant, qui peut aller au-delà. undefined : pas de limite. L'API vérifie de toute façon, ainsi
 * que la date d'entrée du dépôt et des articles dans l'application.
 */
export function earliestVoucherDay(
  today: string,
  backdateDays: number,
  access: MyStockAccess
): string | undefined {
  if (access.role === StockRole.generalManager) return undefined
  return shiftDay(today, -backdateDays)
}
