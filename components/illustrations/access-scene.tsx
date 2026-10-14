import { Illustration, Sparks } from "./illustration"

/** Accès : une clé flotte devant un dépôt, porte ouverte sur ses étagères. */
export function AccessScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="150"
        y="92"
        width="136"
        height="104"
        rx="6"
        className="ill-pale ill-rise"
      />
      <polygon
        points="140,96 218,54 296,96"
        className="ill-main ill-rise ill-delay-1"
      />
      <rect
        x="196"
        y="128"
        width="46"
        height="68"
        rx="4"
        className="ill-deep ill-rise ill-delay-1"
      />
      <rect
        x="204"
        y="140"
        width="30"
        height="6"
        rx="3"
        className="ill-light"
      />
      <rect x="204" y="158" width="30" height="6" rx="3" className="ill-mid" />
      <g className="ill-float">
        <circle cx="74" cy="110" r="26" className="ill-main" />
        <circle cx="74" cy="110" r="10" className="ill-pale" />
        <rect
          x="96"
          y="104"
          width="62"
          height="12"
          rx="6"
          className="ill-main"
        />
        <rect
          x="134"
          y="116"
          width="10"
          height="16"
          rx="3"
          className="ill-main"
        />
        <rect
          x="118"
          y="116"
          width="10"
          height="12"
          rx="3"
          className="ill-main"
        />
      </g>
      <Sparks
        points={[
          [36, 58, 12],
          [126, 60, 10],
          [40, 160, 8],
        ]}
      />
    </Illustration>
  )
}
