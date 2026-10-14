import { Illustration, Sparks } from "./illustration"

/** Validation (charte, chapitre 07) : le carton se pose et la coche se dessine. */
export function ValidatedScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="92"
        y="122"
        width="74"
        height="74"
        rx="6"
        className="ill-mid ill-rise"
      />
      <rect x="121" y="122" width="16" height="20" className="ill-tape" />
      <rect
        x="176"
        y="150"
        width="46"
        height="46"
        rx="5"
        className="ill-light ill-rise ill-delay-1"
      />
      <g className="ill-rise ill-delay-2">
        <circle cx="206" cy="92" r="30" className="ill-main" />
        <path
          d="M192 92 l10 10 l20 -20"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ill-stroke-pale"
        />
      </g>
      <Sparks
        points={[
          [74, 76, 12],
          [256, 64, 10],
          [262, 128, 8],
        ]}
      />
    </Illustration>
  )
}
