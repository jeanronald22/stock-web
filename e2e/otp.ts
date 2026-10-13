import { execFileSync } from "node:child_process"

/**
 * Code de connexion écrit par le fournisseur « console » de Keycloak (local uniquement),
 * lu dans les journaux du conteneur.
 */
export function readLatestOtp(phoneE164: string): string {
  const composeDir = process.env.E2E_KEYCLOAK_COMPOSE_DIR ?? "../stock-api"
  const logs = execFileSync("docker", ["compose", "logs", "keycloak", "--since", "5m"], {
    cwd: composeDir,
    encoding: "utf8",
  })
  const escaped = phoneE164.replace("+", "\\+")
  const codes = [...logs.matchAll(new RegExp(`Code de connexion pour ${escaped} : (\\d+)`, "g"))]
  const latest = codes.at(-1)?.[1]
  if (!latest) throw new Error(`Aucun code trouvé pour ${phoneE164}`)
  return latest
}
