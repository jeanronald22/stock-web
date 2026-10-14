import { Illustration, Sparks } from "./illustration"

const PALLET_SLATS = [92, 132, 172, 212] as const
const CARTONS = [
  [96, 132, "ill-mid"],
  [152, 132, "ill-light"],
  [96, 76, "ill-light"],
] as const

/** Conditionnements : des cartons s'empilent sur une palette ; le dernier arrive en flottant. */
export function PackagingScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="84"
        y="186"
        width="152"
        height="10"
        rx="2"
        className="ill-deep ill-rise"
      />
      {PALLET_SLATS.map((x) => (
        <rect
          key={x}
          x={x}
          y="178"
          width="24"
          height="8"
          className="ill-main ill-rise"
        />
      ))}
      {CARTONS.map(([x, y, tone], index) => (
        <g key={`${x}-${y}`} className={`ill-rise ill-delay-${index + 1}`}>
          <rect x={x} y={y} width="52" height="52" rx="5" className={tone} />
          <rect x={x + 19} y={y} width="14" height="14" className="ill-tape" />
        </g>
      ))}
      <g className="ill-float">
        <rect
          x="160"
          y="60"
          width="52"
          height="52"
          rx="5"
          className="ill-pale"
        />
        <rect x="179" y="60" width="14" height="14" className="ill-tape" />
      </g>
      <Sparks
        points={[
          [52, 90, 10],
          [262, 70, 8],
          [250, 140, 6],
        ]}
      />
    </Illustration>
  )
}
