import { StockState } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

/** Marge au-dessus du plus grand des deux : le trait du seuil ne colle jamais au bout de la jauge. */
const HEADROOM = 1.25

const FILL: Record<StockState, string> = {
  [StockState.ok]: "bg-success",
  [StockState.low]: "bg-warning",
  [StockState.out]: "bg-destructive",
}

/**
 * Jauge de la charte (08, Ligne de stock) : le stock d'un dépôt, et un trait vertical au seuil
 * d'alerte. Décorative : la quantité et l'état sont toujours écrits à côté.
 */
export function StockGauge({
  quantity,
  threshold,
  state,
  className,
}: {
  quantity: number
  threshold: number
  state: StockState
  className?: string
}) {
  const scale = Math.max(quantity, threshold) * HEADROOM
  const share = (value: number) => (scale === 0 ? 0 : (value / scale) * 100)
  return (
    <div
      aria-hidden
      className={cn("relative h-1.5 rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-standard",
          FILL[state],
          // Rupture : un point rouge, pour qu'une jauge vide ne passe pas pour une jauge absente.
          quantity === 0 && "w-1.5"
        )}
        style={quantity === 0 ? undefined : { width: `${share(quantity)}%` }}
      />
      <div
        className="absolute -top-1 h-3.5 w-px bg-foreground/70"
        style={{ left: `${share(threshold)}%` }}
      />
    </div>
  )
}
