/** Types de transition React (addTransitionType) et classes CSS associées (app/globals.css). */
export const TransitionTypes = {
  stepForward: "step-forward",
  stepBack: "step-back",
} as const

/** Noms d'éléments qui ne bougent pas pendant une transition : les repères de l'écran. */
export const AnchoredElements = {
  header: "app-header",
  footer: "app-footer",
} as const
