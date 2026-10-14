import { Illustration, Sparks } from "./illustration"

const DOOR_SLATS = [136, 148, 160, 172, 184] as const

/** Dépôts : un bâtiment de blocs, porte roulante ouverte ; un carton glisse vers l'intérieur. */
export function DepotScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="72"
        y="96"
        width="176"
        height="100"
        rx="6"
        className="ill-pale ill-rise"
      />
      <polygon
        points="60,102 160,54 260,102"
        className="ill-main ill-rise ill-delay-1"
      />
      <rect
        x="126"
        y="124"
        width="68"
        height="72"
        rx="4"
        className="ill-deep ill-rise ill-delay-1"
      />
      {DOOR_SLATS.map((y) => (
        <rect
          key={y}
          x="126"
          y={y}
          width="68"
          height="4"
          className="ill-main ill-rise ill-delay-2"
        />
      ))}
      <rect
        x="258"
        y="160"
        width="36"
        height="36"
        rx="5"
        className="ill-light ill-rise ill-delay-3"
      />
      <rect x="270" y="160" width="12" height="12" className="ill-tape" />
      <g className="ill-slide">
        <rect
          x="16"
          y="166"
          width="30"
          height="30"
          rx="4"
          className="ill-mid"
        />
        <rect x="26" y="166" width="10" height="10" className="ill-tape" />
      </g>
      <Sparks
        points={[
          [44, 70, 10],
          [276, 74, 8],
          [228, 40, 6],
        ]}
      />
    </Illustration>
  )
}
