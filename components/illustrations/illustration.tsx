import { cn } from "@/lib/utils"

/**
 * Cadre commun des illustrations abstraites : même grille (320 × 220) et même sol pour toutes les
 * scènes. Purement décoratives : le texte de l'écran porte le sens.
 */
export function Illustration({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <svg
      viewBox="0 0 320 220"
      aria-hidden
      focusable="false"
      className={cn("block h-auto w-full overflow-visible", className)}
    >
      <rect
        x="16"
        y="196"
        width="288"
        height="3"
        rx="1.5"
        className="ill-floor"
      />
      {children}
    </svg>
  )
}

/** Petits carrés qui dérivent : la touche de vie commune à toutes les scènes. */
export function Sparks({
  points,
}: {
  points: ReadonlyArray<readonly [x: number, y: number, size: number]>
}) {
  return points.map(([x, y, size], index) => (
    <rect
      key={`${x}-${y}`}
      x={x}
      y={y}
      width={size}
      height={size}
      rx="2"
      className={cn(
        index % 2 ? "ill-pale" : "ill-light",
        "ill-drift",
        index > 0 && `ill-delay-${Math.min(index, 3)}`
      )}
    />
  ))
}
