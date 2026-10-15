import { createSerwistRoute } from "@serwist/turbopack"
import { randomUUID } from "node:crypto"

import { Routes } from "@/lib/routes"

/**
 * Le service worker (lib/service-worker/sw.ts), construit au build avec la liste des fichiers de
 * l'application à garder (D39). Les écrans du terrain sont gardés d'emblée, avec l'écran hors ligne.
 */
const revision = randomUUID()

/** Au-delà, un fichier n'est pas gardé à l'installation (forfaits mobiles). */
const PRECACHE_MAX_FILE_BYTES = 400 * 1024

/** Pages ouvertes sans réseau dès l'installation : celles du terrain. */
const FIELD_PAGES = [
  Routes.offline,
  Routes.dashboard,
  Routes.stock,
  Routes.vouchers,
  Routes.newReceipt,
  Routes.newIssue,
  Routes.newTransfer,
  Routes.newDamage,
  Routes.newAdjustment,
  Routes.items,
]

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "lib/service-worker/sw.ts",
    additionalPrecacheEntries: FIELD_PAGES.map((url) => ({ url, revision })),
    // Les bibliothèques chargées à la demande (PDF, étiquettes, lecteur de codes de secours) ne
    // servent pas sur le terrain : gardées à leur premier usage, pas à l'installation.
    maximumFileSizeToCacheInBytes: PRECACHE_MAX_FILE_BYTES,
  })
