"use client"

import { addTransitionType, startTransition, useCallback } from "react"

import { TransitionTypes } from "./transitions"

/**
 * Change d'étape dans une transition React, en indiquant le sens pour l'animation. L'étape doit être
 * un état propre au parcours, jamais déduite des données chargées : un rechargement changerait
 * l'écran hors transition, sans animation.
 */
export function useStepNavigation<Step>(setStep: (step: Step) => void) {
  const go = useCallback(
    (step: Step, direction: keyof typeof TransitionTypes) =>
      startTransition(() => {
        addTransitionType(TransitionTypes[direction])
        setStep(step)
      }),
    [setStep]
  )
  return {
    forward: useCallback((step: Step) => go(step, "stepForward"), [go]),
    back: useCallback((step: Step) => go(step, "stepBack"), [go]),
  }
}
