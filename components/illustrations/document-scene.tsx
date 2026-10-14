import { Illustration, Sparks } from "./illustration"

const LINES = [96, 116, 136] as const

/** Détails du bon : une feuille aux lignes de blocs, et un tampon qui vient s'y poser. */
export function DocumentScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="96"
        y="52"
        width="128"
        height="144"
        rx="8"
        className="ill-pale ill-rise"
      />
      <rect
        x="112"
        y="70"
        width="64"
        height="12"
        rx="4"
        className="ill-main ill-rise ill-delay-1"
      />
      {LINES.map((y, index) => (
        <rect
          key={y}
          x="112"
          y={y}
          width={index === 1 ? 72 : 96}
          height="8"
          rx="4"
          className={`ill-light ill-rise ill-delay-${index + 1}`}
        />
      ))}
      <g className="ill-float">
        <circle cx="216" cy="166" r="24" className="ill-mid" />
        <path
          d="M205 166 l8 8 l14 -15"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ill-stroke-pale"
        />
      </g>
      <Sparks
        points={[
          [56, 88, 10],
          [262, 70, 8],
        ]}
      />
    </Illustration>
  )
}
