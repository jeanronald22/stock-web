import { Illustration, Sparks } from "./illustration"

/** Fournisseurs : un camion de cartons arrive au dépôt. */
export function TruckScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="236"
        y="104"
        width="64"
        height="92"
        rx="5"
        className="ill-pale ill-rise"
      />
      <polygon
        points="228,108 268,86 308,108"
        className="ill-main ill-rise ill-delay-1"
      />
      <g className="ill-slide">
        <rect
          x="20"
          y="116"
          width="112"
          height="64"
          rx="5"
          className="ill-main"
        />
        <rect
          x="132"
          y="136"
          width="40"
          height="44"
          rx="6"
          className="ill-deep"
        />
        <rect
          x="142"
          y="144"
          width="20"
          height="14"
          rx="3"
          className="ill-pale"
        />
        <rect
          x="32"
          y="128"
          width="28"
          height="28"
          rx="4"
          className="ill-light"
        />
        <rect
          x="66"
          y="128"
          width="28"
          height="28"
          rx="4"
          className="ill-pale"
        />
        <rect
          x="100"
          y="128"
          width="24"
          height="28"
          rx="4"
          className="ill-light"
        />
        <circle cx="52" cy="186" r="12" className="ill-deep" />
        <circle cx="148" cy="186" r="12" className="ill-deep" />
      </g>
      <Sparks
        points={[
          [200, 60, 10],
          [276, 54, 8],
        ]}
      />
    </Illustration>
  )
}
