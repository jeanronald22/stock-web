import { Illustration, Sparks } from "./illustration"

/** « Comment vous appelez-vous ? » : un badge abstrait, posé sur une pile de cartons. */
export function IdentityScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="44"
        y="150"
        width="46"
        height="46"
        rx="5"
        className="ill-light ill-rise"
      />
      <rect x="61" y="150" width="12" height="14" className="ill-tape" />
      <g className="ill-float">
        <rect
          x="104"
          y="58"
          width="136"
          height="104"
          rx="12"
          className="ill-main"
        />
        <rect
          x="104"
          y="58"
          width="136"
          height="24"
          rx="12"
          className="ill-deep"
        />
        <rect
          x="160"
          y="50"
          width="24"
          height="16"
          rx="4"
          className="ill-mid"
        />
        <circle cx="140" cy="118" r="20" className="ill-light" />
        <rect
          x="172"
          y="104"
          width="52"
          height="10"
          rx="5"
          className="ill-pale"
        />
        <rect
          x="172"
          y="122"
          width="36"
          height="10"
          rx="5"
          className="ill-mid"
        />
      </g>
      <rect
        x="252"
        y="160"
        width="36"
        height="36"
        rx="5"
        className="ill-mid ill-rise ill-delay-2"
      />
      <rect x="264" y="160" width="10" height="11" className="ill-tape" />
      <Sparks
        points={[
          [62, 64, 12],
          [272, 74, 10],
          [286, 120, 8],
        ]}
      />
    </Illustration>
  )
}
