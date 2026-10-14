import { Illustration, Sparks } from "./illustration"

/** Photo de l'article : un cadre, un soleil et deux collines de blocs ; un carton y entre en flottant. */
export function PhotoScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="72"
        y="52"
        width="176"
        height="144"
        rx="10"
        className="ill-pale ill-rise"
      />
      <rect
        x="84"
        y="64"
        width="152"
        height="120"
        rx="6"
        className="ill-light ill-rise ill-delay-1"
      />
      <circle
        cx="200"
        cy="96"
        r="14"
        className="ill-pale ill-rise ill-delay-2"
      />
      <polygon
        points="84,184 132,124 176,184"
        className="ill-main ill-rise ill-delay-2"
      />
      <polygon
        points="146,184 190,140 236,184"
        className="ill-deep ill-rise ill-delay-3"
      />
      <g className="ill-float">
        <rect
          x="236"
          y="148"
          width="40"
          height="40"
          rx="5"
          className="ill-mid"
        />
        <rect x="250" y="148" width="12" height="12" className="ill-tape" />
      </g>
      <Sparks
        points={[
          [44, 80, 10],
          [276, 60, 8],
        ]}
      />
    </Illustration>
  )
}
