/**
 * Dessin d'un code-barres pour les étiquettes (D36). La symbologie suit le code : EAN-13, EAN-8 ou
 * UPC-A quand il en a la forme et la clé, Code 128 sinon (références, codes internes alphanumériques).
 */
export const BarcodeSymbology = {
  ean13: "ean13",
  ean8: "ean8",
  upcA: "upca",
  code128: "code128",
} as const
export type BarcodeSymbology =
  (typeof BarcodeSymbology)[keyof typeof BarcodeSymbology]

const GTIN_LENGTHS: Record<number, BarcodeSymbology> = {
  13: BarcodeSymbology.ean13,
  8: BarcodeSymbology.ean8,
  12: BarcodeSymbology.upcA,
}
const DIGITS = /^\d+$/
const RADIX = 10
const ODD_FROM_RIGHT_WEIGHT = 3

/** Clé GS1 (EAN, UPC) : en partant de la droite, un chiffre sur deux pondéré par 3. */
function gtinCheckDigit(body: string): number {
  const sum = [...body]
    .reverse()
    .reduce(
      (total, digit, index) =>
        total + Number(digit) * (index % 2 === 0 ? ODD_FROM_RIGHT_WEIGHT : 1),
      0
    )
  return (RADIX - (sum % RADIX)) % RADIX
}

export function barcodeSymbology(code: string): BarcodeSymbology {
  const gtin = GTIN_LENGTHS[code.length]
  if (gtin && DIGITS.test(code)) {
    const valid = gtinCheckDigit(code.slice(0, -1)) === Number(code.at(-1))
    if (valid) return gtin
  }
  return BarcodeSymbology.code128
}

/** Un tracé du dessin : barres (trait épais) ou surfaces (remplissage). */
export type BarcodePath = {
  d: string
  stroke?: string
  strokeWidth?: number
  fill?: string
}

/** Dessin vectoriel, dans son propre repère ([width] × [height]). */
export type BarcodeShape = {
  width: number
  height: number
  paths: BarcodePath[]
  /** Le même dessin en SVG, pour l'aperçu à l'écran. */
  svg: string
}

const VIEW_BOX = /viewBox="0 0 ([\d.]+) ([\d.]+)"/
const PATH = /<path([^>]*)\/>/g
const ATTRIBUTE = /([\w-]+)="([^"]*)"/g

function parse(svg: string): BarcodeShape {
  const box = VIEW_BOX.exec(svg)
  if (!box) throw new Error("Dessin de code-barres illisible")
  const paths = [...svg.matchAll(PATH)].map(([, attributes]) => {
    const values = Object.fromEntries(
      [...attributes.matchAll(ATTRIBUTE)].map(([, name, value]) => [
        name,
        value,
      ])
    )
    return {
      d: values.d,
      stroke: values.stroke,
      strokeWidth: values["stroke-width"]
        ? Number(values["stroke-width"])
        : undefined,
      fill: values.fill,
    }
  })
  return { width: Number(box[1]), height: Number(box[2]), paths, svg }
}

/**
 * Dessin du code, sans les chiffres (l'étiquette les écrit dans sa police). La bibliothèque n'est
 * chargée qu'au premier code dessiné.
 */
export async function drawBarcode(code: string): Promise<BarcodeShape> {
  const { toSVG } = await import("bwip-js/browser")
  return parse(
    toSVG({ bcid: barcodeSymbology(code), text: code, includetext: false })
  )
}
