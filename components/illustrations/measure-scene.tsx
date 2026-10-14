import { Illustration, Sparks } from "./illustration"

const TICKS = [52, 76, 100, 124, 148, 172, 196, 220, 244, 268] as const
const BLOCKS = [
  [64, 24, "ill-pale"],
  [112, 40, "ill-light"],
  [176, 60, "ill-mid"],
] as const

/** Unité de comptage : une règle et des blocs de plus en plus grands, posés dessus. */
export function MeasureScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="40"
        y="176"
        width="240"
        height="20"
        rx="4"
        className="ill-main ill-rise"
      />
      {TICKS.map((x, index) => (
        <rect
          key={x}
          x={x}
          y="176"
          width="3"
          height={index % 2 ? 8 : 12}
          className="ill-pale"
        />
      ))}
      {BLOCKS.map(([x, size, tone], index) => (
        <rect
          key={x}
          x={x}
          y={176 - size}
          width={size}
          height={size}
          rx="4"
          className={`${tone} ill-rise ill-delay-${index + 1}`}
        />
      ))}
      <rect x="196" y="116" width="20" height="16" className="ill-tape" />
      <g className="ill-float">
        <rect
          x="250"
          y="96"
          width="34"
          height="34"
          rx="5"
          className="ill-light"
        />
        <rect x="261" y="96" width="12" height="12" className="ill-tape" />
      </g>
      <Sparks
        points={[
          [56, 92, 10],
          [150, 60, 8],
        ]}
      />
    </Illustration>
  )
}
