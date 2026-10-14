import { Illustration, Sparks } from "./illustration"

const BLOCKS = [
  [40, 140, 56, 56, "ill-pale"],
  [104, 160, 40, 36, "ill-light"],
  [176, 150, 48, 46, "ill-pale"],
  [232, 168, 48, 28, "ill-light"],
] as const

/** Nom et adresse du dépôt : un repère qui flotte au-dessus d'un quartier de blocs. */
export function LocationScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      {BLOCKS.map(([x, y, width, height, tone], index) => (
        <rect
          key={x}
          x={x}
          y={y}
          width={width}
          height={height}
          rx="5"
          className={`${tone} ill-rise ill-delay-${(index % 3) + 1}`}
        />
      ))}
      <rect
        x="150"
        y="160"
        width="20"
        height="36"
        rx="3"
        className="ill-main ill-rise"
      />
      <g className="ill-float">
        <path
          d="M160 140 C 132 104, 128 92, 128 78 A 32 32 0 0 1 192 78 C 192 92, 188 104, 160 140 Z"
          className="ill-main"
        />
        <circle cx="160" cy="78" r="12" className="ill-pale" />
      </g>
      <Sparks
        points={[
          [60, 70, 10],
          [252, 84, 8],
          [228, 40, 6],
        ]}
      />
    </Illustration>
  )
}
