/**
 * Raccourcis de période des rapports et de l'accueil (D38). Les dates sont celles de l'appareil
 * (AAAA-MM-JJ), bornes comprises ; l'API les lit au fuseau des dépôts.
 */
export const PeriodPreset = {
  last7Days: "last7Days",
  last30Days: "last30Days",
  thisMonth: "thisMonth",
  lastMonth: "lastMonth",
  last3Months: "last3Months",
} as const
export type PeriodPreset = (typeof PeriodPreset)[keyof typeof PeriodPreset]

/** Sans période dans l'adresse : celle de l'API par défaut. */
export const DEFAULT_PRESET = PeriodPreset.last30Days

export type Period = { from: string; to: string }

const DAYS_7 = 7
const DAYS_30 = 30
const MONTHS_3 = 3

export function isoDay(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function daysBack(today: Date, days: number): Period {
  const start = new Date(today)
  start.setDate(start.getDate() - (days - 1))
  return { from: isoDay(start), to: isoDay(today) }
}

export function presetPeriod(preset: PeriodPreset, today = new Date()): Period {
  const year = today.getFullYear()
  const month = today.getMonth()
  switch (preset) {
    case PeriodPreset.last7Days:
      return daysBack(today, DAYS_7)
    case PeriodPreset.last30Days:
      return daysBack(today, DAYS_30)
    case PeriodPreset.thisMonth:
      return { from: isoDay(new Date(year, month, 1)), to: isoDay(today) }
    case PeriodPreset.lastMonth:
      return {
        from: isoDay(new Date(year, month - 1, 1)),
        to: isoDay(new Date(year, month, 0)),
      }
    case PeriodPreset.last3Months:
      return {
        from: isoDay(new Date(year, month - (MONTHS_3 - 1), 1)),
        to: isoDay(today),
      }
  }
}

/** Le raccourci qui donne exactement cette période ; null pour des dates libres. */
export function presetOf(period: Period): PeriodPreset | null {
  return (
    Object.values(PeriodPreset).find((preset) => {
      const candidate = presetPeriod(preset)
      return candidate.from === period.from && candidate.to === period.to
    }) ?? null
  )
}

/** Même durée, juste avant : pour comparer (« +12 % sur la période précédente »). */
export function previousPeriod(period: Period): Period {
  const from = new Date(`${period.from}T12:00:00`)
  const to = new Date(`${period.to}T12:00:00`)
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
  const end = new Date(from)
  end.setDate(end.getDate() - 1)
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  return { from: isoDay(start), to: isoDay(end) }
}
