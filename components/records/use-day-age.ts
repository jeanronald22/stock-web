"use client"

import { useLocale, useNow } from "next-intl"
import { useCallback, useMemo } from "react"

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** Minuit du jour de [date], dans le fuseau de l'appareil. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * « aujourd'hui », « hier », « il y a 3 jours » : une date au jour près, en jours de calendrier
 * (une livraison d'hier soir est d'hier, même 2 heures plus tard).
 */
export function useDayAge() {
  const locale = useLocale()
  const now = useNow({ updateInterval: HOUR_MS })
  const formatter = useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    [locale]
  )
  return useCallback(
    (date: Date) =>
      formatter.format(
        Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS),
        "day"
      ),
    [formatter, now]
  )
}
