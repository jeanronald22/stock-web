// Sert le lecteur de codes-barres (WebAssembly) depuis l'application, sans CDN (DECISIONS.md, D34) :
// copié de node_modules à chaque dev et build, donc toujours à la version installée.
import { copyFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

const require = createRequire(import.meta.url)
const source = require.resolve("zxing-wasm/reader/zxing_reader.wasm")
const target = path.join(
  import.meta.dirname,
  "../public/vendor/zxing/zxing_reader.wasm"
)
mkdirSync(path.dirname(target), { recursive: true })
copyFileSync(source, target)
