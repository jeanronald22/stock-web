import { ViewTransition } from "react"

/**
 * Arrivée sur un nouvel écran : le contenu monte légèrement en fondu, l'ancien s'efface. À placer
 * dans page.tsx, autour de tout l'écran (voir StepTransition).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  )
}
