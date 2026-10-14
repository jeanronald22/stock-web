import { Illustration, Sparks } from "./illustration"

/** Dépôts de l'article : deux bâtiments, l'un coché, l'autre non. */
export function DepotsScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="44"
        y="120"
        width="104"
        height="76"
        rx="5"
        className="ill-pale ill-rise"
      />
      <polygon
        points="36,124 96,90 156,124"
        className="ill-main ill-rise ill-delay-1"
      />
      <rect
        x="80"
        y="150"
        width="32"
        height="46"
        rx="3"
        className="ill-deep ill-rise ill-delay-1"
      />
      <rect
        x="176"
        y="136"
        width="104"
        height="60"
        rx="5"
        className="ill-pale ill-rise ill-delay-2"
      />
      <polygon
        points="168,140 228,110 288,140"
        className="ill-light ill-rise ill-delay-2"
      />
      <rect
        x="212"
        y="160"
        width="32"
        height="36"
        rx="3"
        className="ill-mid ill-rise ill-delay-3"
      />
      <g className="ill-float">
        <circle cx="96" cy="58" r="20" className="ill-main" />
        <path
          d="M86 58 l7 7 l13 -14"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ill-stroke-pale"
        />
      </g>
      <Sparks
        points={[
          [258, 74, 10],
          [176, 52, 8],
        ]}
      />
    </Illustration>
  )
}
