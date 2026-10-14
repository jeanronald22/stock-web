"use client"

import "driver.js/dist/driver.css"

import { driver } from "driver.js"
import { useTranslations } from "next-intl"
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useAuth } from "react-oidc-context"

import { hasSeenTour, markTourSeen } from "@/lib/tour/seen-tours"
import {
  anchorSelector,
  tours,
  tourStepKey,
  type TourId,
} from "@/lib/tour/tours"

const POPOVER_CLASS = "kk-tour"
/** Laisse l'écran se poser (transition d'arrivée) avant de montrer la première bulle. */
const START_DELAY_MS = 450
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"
/** Jetons remplacés par driver.js dans le texte de progression. */
const DRIVER_PROGRESS = { current: "{{current}}", total: "{{total}}" } as const

type TourContextValue = {
  /** Visite de l'écran affiché, relancée par le bouton d'aide. */
  current: TourId | null
  setCurrent: (tour: TourId | null) => void
  start: (tour: TourId) => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("tours")
  const subject = useAuth().user?.profile.sub
  const [current, setCurrent] = useState<TourId | null>(null)

  const start = useCallback(
    (tour: TourId) => {
      const steps = tours[tour]
        .filter((step) => document.querySelector(anchorSelector(step.anchor)))
        .map((step) => {
          const key = tourStepKey(tour, step)
          return {
            element: anchorSelector(step.anchor),
            popover: {
              title: t(`${key}.title`),
              description: t(`${key}.description`),
            },
          }
        })
      if (steps.length === 0) return
      if (subject) markTourSeen(subject, tour)
      driver({
        steps,
        popoverClass: POPOVER_CLASS,
        animate: !window.matchMedia(REDUCED_MOTION).matches,
        showProgress: steps.length > 1,
        progressText: t("progress", DRIVER_PROGRESS),
        nextBtnText: t("next"),
        prevBtnText: t("previous"),
        doneBtnText: t("done"),
        stagePadding: 6,
        stageRadius: 12,
      }).drive()
    },
    [t, subject]
  )

  const value = useMemo(
    () => ({ current, setCurrent, start }),
    [current, start]
  )
  return <TourContext value={value}>{children}</TourContext>
}

function useTourContext(): TourContextValue {
  const context = use(TourContext)
  if (!context)
    throw new Error("useTourContext doit être utilisé sous TourProvider")
  return context
}

/**
 * Déclare la visite de l'écran : elle s'ouvre seule la première fois, dès que l'écran est prêt
 * (données chargées), puis reste accessible par le bouton d'aide.
 */
export function usePageTour(
  tour: TourId,
  { ready = true }: { ready?: boolean } = {}
) {
  const { setCurrent, start } = useTourContext()
  const subject = useAuth().user?.profile.sub

  useEffect(() => {
    setCurrent(tour)
    return () => setCurrent(null)
  }, [tour, setCurrent])

  useEffect(() => {
    if (!ready || !subject || hasSeenTour(subject, tour)) return
    const timer = window.setTimeout(() => start(tour), START_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [ready, subject, tour, start])
}

export function useCurrentTour() {
  const { current, start } = useTourContext()
  return { available: current !== null, start: () => current && start(current) }
}
