import { Illustration, Sparks } from "./illustration"

const BARCODE = [
  [204, 4],
  [212, 2],
  [218, 6],
  [228, 2],
  [234, 4],
] as const

/** Articles : un carton et son étiquette qui se balance, prête à recevoir un nom. */
export function CatalogScene({ className }: { className?: string }) {
  return (
    <Illustration className={className}>
      <rect
        x="54"
        y="150"
        width="46"
        height="46"
        rx="5"
        className="ill-mid ill-rise ill-delay-2"
      />
      <rect
        x="62"
        y="116"
        width="32"
        height="32"
        rx="4"
        className="ill-pale ill-rise ill-delay-3"
      />
      <rect
        x="110"
        y="92"
        width="112"
        height="104"
        rx="6"
        className="ill-light ill-rise"
      />
      <rect x="154" y="92" width="24" height="22" className="ill-tape" />
      <g
        className="ill-swing"
        style={{ "--swing-origin": "198px 108px" } as React.CSSProperties}
      >
        <rect
          x="196"
          y="104"
          width="4"
          height="22"
          rx="2"
          className="ill-deep"
        />
        <rect
          x="194"
          y="124"
          width="54"
          height="36"
          rx="6"
          className="ill-main"
        />
        {BARCODE.map(([x, width]) => (
          <rect
            key={x}
            x={x}
            y="134"
            width={width}
            height="16"
            className="ill-pale"
          />
        ))}
      </g>
      <Sparks
        points={[
          [262, 72, 10],
          [40, 84, 8],
          [150, 50, 6],
        ]}
      />
    </Illustration>
  )
}
