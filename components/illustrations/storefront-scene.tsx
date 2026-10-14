import { Illustration, Sparks } from "./illustration"

const AWNING_STRIPES = [96, 120, 144, 168, 192, 216] as const

/** « Parlez-nous de votre entreprise » : une boutique faite de blocs, des cartons devant la porte. */
export function StorefrontScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="92"
        y="88"
        width="148"
        height="108"
        rx="6"
        className="ill-pale ill-rise"
      />
      {AWNING_STRIPES.map((x, index) => (
        <rect
          key={x}
          x={x}
          y="70"
          width="24"
          height="26"
          rx="3"
          className={`${index % 2 ? "ill-light" : "ill-main"} ill-rise ill-delay-1`}
        />
      ))}
      <rect
        x="148"
        y="132"
        width="36"
        height="64"
        rx="4"
        className="ill-main ill-rise ill-delay-1"
      />
      <rect
        x="106"
        y="118"
        width="30"
        height="30"
        rx="4"
        className="ill-light ill-rise ill-delay-2"
      />
      <rect
        x="196"
        y="118"
        width="30"
        height="30"
        rx="4"
        className="ill-light ill-rise ill-delay-2"
      />
      <rect
        x="40"
        y="160"
        width="40"
        height="36"
        rx="5"
        className="ill-mid ill-rise ill-delay-3"
      />
      <rect x="54" y="160" width="12" height="12" className="ill-tape" />
      <g className="ill-float">
        <rect
          x="252"
          y="146"
          width="44"
          height="50"
          rx="5"
          className="ill-deep"
        />
        <rect x="268" y="146" width="12" height="14" className="ill-tape" />
      </g>
      <Sparks
        points={[
          [60, 70, 12],
          [270, 92, 10],
          [36, 120, 8],
        ]}
      />
    </Illustration>
  )
}
