import { readPublicConfig } from "@/lib/config/public-config"

/** Lue à chaque requête : la configuration de l'environnement d'exécution, jamais celle du build. */
export const dynamic = "force-dynamic"

const CACHE_SECONDS = 300

export function GET() {
  return Response.json(readPublicConfig(process.env), {
    headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
  })
}
