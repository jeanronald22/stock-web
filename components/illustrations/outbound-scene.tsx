import { Illustration, Sparks } from "./illustration"

/** Sortie : un diable emporte des cartons hors du dépôt. */
export function OutboundScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="40"
        y="96"
        width="96"
        height="100"
        rx="5"
        className="ill-pale ill-rise"
      />
      <polygon
        points="32,100 88,70 144,100"
        className="ill-main ill-rise ill-delay-1"
      />
      <rect
        x="70"
        y="140"
        width="36"
        height="56"
        rx="3"
        className="ill-deep ill-rise ill-delay-1"
      />
      <g className="ill-slide-out">
        <rect
          x="170"
          y="98"
          width="8"
          height="98"
          rx="3"
          className="ill-deep"
        />
        <rect
          x="170"
          y="188"
          width="56"
          height="8"
          rx="3"
          className="ill-deep"
        />
        <circle cx="182" cy="198" r="9" className="ill-main" />
        <rect
          x="182"
          y="146"
          width="40"
          height="40"
          rx="4"
          className="ill-mid"
        />
        <rect x="196" y="146" width="12" height="12" className="ill-tape" />
        <rect
          x="186"
          y="112"
          width="32"
          height="32"
          rx="4"
          className="ill-light"
        />
      </g>
      <Sparks
        points={[
          [262, 70, 10],
          [150, 56, 8],
        ]}
      />
    </Illustration>
  )
}
