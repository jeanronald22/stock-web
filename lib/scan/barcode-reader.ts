/** Formats lus : produits (EAN, UPC), logistique (Code 128, Code 39, ITF) et QR codes simples. */
const FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "qr_code",
] as const

/** Le lecteur de repli (WebAssembly), servi par l'application (scripts/copy-zxing.mjs, D34). */
const WASM_PATH = "/vendor/zxing/zxing_reader.wasm"
const WASM_SUFFIX = ".wasm"

/** Ce que l'on attend d'un lecteur : l'API standard du navigateur, ou son repli. */
export type BarcodeReader = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}

type NativeDetector = {
  new (options: { formats: string[] }): BarcodeReader
  getSupportedFormats: () => Promise<string[]>
}

let reader: Promise<BarcodeReader> | null = null

/**
 * Lecteur de codes-barres, créé une fois : celui du navigateur s'il lit les codes des produits
 * (Chrome sur Android), sinon le repli, chargé seulement à la première ouverture de la caméra.
 */
export function barcodeReader(): Promise<BarcodeReader> {
  reader ??= create()
  return reader
}

async function create(): Promise<BarcodeReader> {
  const native = (globalThis as { BarcodeDetector?: NativeDetector })
    .BarcodeDetector
  if (native) {
    const supported = await native
      .getSupportedFormats()
      .catch(() => [] as string[])
    const formats = FORMATS.filter((format) => supported.includes(format))
    if (formats.includes("ean_13")) return new native({ formats })
  }
  const { BarcodeDetector, prepareZXingModule } =
    await import("barcode-detector/ponyfill")
  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith(WASM_SUFFIX) ? WASM_PATH : prefix + path,
    },
  })
  return new BarcodeDetector({ formats: [...FORMATS] })
}
