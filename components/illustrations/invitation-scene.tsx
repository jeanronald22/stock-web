import { Illustration, Sparks } from "./illustration"

/** Invitation : une enveloppe flotte, une carte en sort ; un carton attend au sol. */
export function InvitationScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="40"
        y="150"
        width="46"
        height="46"
        rx="5"
        className="ill-light ill-rise"
      />
      <rect x="57" y="150" width="12" height="14" className="ill-tape" />
      <g className="ill-float">
        <rect
          x="128"
          y="44"
          width="96"
          height="72"
          rx="8"
          className="ill-pale"
        />
        <rect
          x="142"
          y="60"
          width="52"
          height="10"
          rx="5"
          className="ill-mid"
        />
        <rect
          x="142"
          y="78"
          width="36"
          height="10"
          rx="5"
          className="ill-light"
        />
        <rect
          x="108"
          y="88"
          width="136"
          height="88"
          rx="10"
          className="ill-main"
        />
        <polygon
          points="108,96 176,140 244,96 244,176 108,176"
          className="ill-deep"
        />
        <polygon points="108,176 176,128 244,176" className="ill-main" />
      </g>
      <rect
        x="258"
        y="160"
        width="36"
        height="36"
        rx="5"
        className="ill-mid ill-rise ill-delay-2"
      />
      <Sparks
        points={[
          [76, 62, 12],
          [266, 58, 10],
          [284, 118, 8],
        ]}
      />
    </Illustration>
  )
}
