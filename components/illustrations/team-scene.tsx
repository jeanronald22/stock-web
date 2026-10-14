import { Illustration, Sparks } from "./illustration"

/** Équipe : trois silhouettes abstraites côte à côte, un carton posé à leurs pieds. */
export function TeamScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <g className="ill-rise">
        <circle cx="92" cy="110" r="17" className="ill-mid" />
        <rect
          x="68"
          y="134"
          width="48"
          height="62"
          rx="20"
          className="ill-mid"
        />
      </g>
      <g className="ill-rise ill-delay-1">
        <circle cx="160" cy="88" r="21" className="ill-main" />
        <rect
          x="130"
          y="116"
          width="60"
          height="80"
          rx="24"
          className="ill-main"
        />
      </g>
      <g className="ill-rise ill-delay-2">
        <circle cx="228" cy="110" r="17" className="ill-light" />
        <rect
          x="204"
          y="134"
          width="48"
          height="62"
          rx="20"
          className="ill-light"
        />
      </g>
      <rect
        x="262"
        y="166"
        width="30"
        height="30"
        rx="4"
        className="ill-pale ill-rise ill-delay-3"
      />
      <rect x="272" y="166" width="10" height="9" className="ill-tape" />
      <Sparks
        points={[
          [44, 76, 12],
          [204, 56, 10],
          [276, 92, 8],
        ]}
      />
    </Illustration>
  )
}
