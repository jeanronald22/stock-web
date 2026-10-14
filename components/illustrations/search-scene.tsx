import { Illustration, Sparks } from "./illustration"

/** Recherche sans résultat : une loupe passe au-dessus d'un carton vide. */
export function SearchScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="96"
        y="120"
        width="96"
        height="76"
        rx="6"
        className="ill-pale ill-rise"
      />
      <rect x="132" y="120" width="24" height="18" className="ill-tape" />
      <g className="ill-float">
        <circle
          cx="198"
          cy="92"
          r="34"
          strokeWidth="12"
          fill="none"
          className="ill-stroke-main"
        />
        <rect
          x="222"
          y="118"
          width="16"
          height="44"
          rx="6"
          transform="rotate(-45 230 140)"
          className="ill-deep"
        />
      </g>
      <Sparks
        points={[
          [62, 92, 10],
          [262, 66, 8],
        ]}
      />
    </Illustration>
  )
}
