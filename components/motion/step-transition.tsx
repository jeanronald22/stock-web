import { ViewTransition } from "react"

import { TransitionTypes } from "./transitions"

/**
 * Passage d'une étape à l'autre d'un parcours : glissement vers l'avant ou vers l'arrière selon le
 * type de la transition (voir useStepNavigation). [stepKey] identifie l'étape affichée.
 *
 * À placer autour de l'étape entière : React n'anime l'entrée ou la sortie que du <ViewTransition>
 * le plus extérieur de ce qui apparaît ou disparaît.
 */
export function StepTransition({
  stepKey,
  children,
}: {
  stepKey: string
  children: React.ReactNode
}) {
  const directions = {
    [TransitionTypes.stepForward]: TransitionTypes.stepForward,
    [TransitionTypes.stepBack]: TransitionTypes.stepBack,
    default: "none",
  }
  return (
    <ViewTransition
      key={stepKey}
      enter={directions}
      exit={directions}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
