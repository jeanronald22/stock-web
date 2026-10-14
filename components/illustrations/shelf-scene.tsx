import { Illustration } from "./illustration"

const SHELVES = [92, 144] as const
const CARTONS = [
  [80, 62, 36, "ill-light"],
  [122, 70, 28, "ill-pale"],
  [156, 58, 40, "ill-mid"],
  [84, 112, 40, "ill-mid"],
  [130, 120, 32, "ill-light"],
  [168, 114, 38, "ill-pale"],
] as const

/** Accueil : une étagère de dépôt qui attend ses premiers articles. */
export function ShelfScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect x="64" y="40" width="10" height="156" rx="3" className="ill-deep" />
      <rect
        x="214"
        y="40"
        width="10"
        height="156"
        rx="3"
        className="ill-deep"
      />
      {SHELVES.map((y) => (
        <rect
          key={y}
          x="64"
          y={y + 6}
          width="160"
          height="8"
          rx="3"
          className="ill-deep"
        />
      ))}
      {CARTONS.map(([x, y, size, tone], index) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y + (40 - size)}
          width={size}
          height={size}
          rx="4"
          className={`${tone} ill-rise ill-delay-${(index % 3) + 1}`}
        />
      ))}
      <g className="ill-float">
        <rect
          x="244"
          y="150"
          width="46"
          height="46"
          rx="5"
          className="ill-light"
        />
        <rect x="261" y="150" width="12" height="14" className="ill-tape" />
      </g>
    </Illustration>
  )
}
