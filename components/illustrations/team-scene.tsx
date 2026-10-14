import { Illustration, Sparks } from "./illustration"

/** Équipe : trois silhouettes abstraites côte à côte, devant une pile de cartons. */
export function TeamScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="236"
        y="150"
        width="46"
        height="46"
        rx="5"
        className="ill-light ill-rise"
      />
      <rect x="253" y="150" width="12" height="14" className="ill-tape" />
      <rect
        x="246"
        y="112"
        width="34"
        height="38"
        rx="5"
        className="ill-pale ill-rise ill-delay-1"
      />
      <g className="ill-rise">
        <circle cx="88" cy="104" r="18" className="ill-mid" />
        <rect
          x="62"
          y="128"
          width="52"
          height="68"
          rx="22"
          className="ill-mid"
        />
      </g>
      <g className="ill-rise ill-delay-1">
        <circle cx="150" cy="84" r="22" className="ill-main" />
        <rect
          x="118"
          y="112"
          width="64"
          height="84"
          rx="26"
          className="ill-main"
        />
      </g>
      <g className="ill-rise ill-delay-2">
        <circle cx="208" cy="110" r="16" className="ill-light" />
        <rect
          x="186"
          y="132"
          width="44"
          height="64"
          rx="20"
          className="ill-light"
        />
      </g>
      <Sparks
        points={[
          [40, 70, 12],
          [200, 52, 10],
          [288, 92, 8],
        ]}
      />
    </Illustration>
  )
}
