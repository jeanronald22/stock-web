import { z } from "zod"

/**
 * Configuration lue au démarrage du serveur et transmise au navigateur. Les variables
 * NEXT_PUBLIC_* seraient figées au build : une même image ne pourrait pas servir plusieurs
 * environnements (recette, production).
 */
export const publicConfigSchema = z.object({
  keycloakUrl: z.url(),
  keycloakRealm: z.string().min(1),
  keycloakClientId: z.string().min(1),
  apiUrl: z.url(),
})

export type PublicConfig = z.infer<typeof publicConfigSchema>

/** Noms des variables d'environnement du serveur Next.js. */
export const PublicConfigEnv = {
  keycloakUrl: "KEYCLOAK_URL",
  keycloakRealm: "KEYCLOAK_REALM",
  keycloakClientId: "KEYCLOAK_CLIENT_ID",
  apiUrl: "API_URL",
} as const satisfies Record<keyof PublicConfig, string>

export function readPublicConfig(env: NodeJS.ProcessEnv): PublicConfig {
  return publicConfigSchema.parse(
    Object.fromEntries(
      Object.entries(PublicConfigEnv).map(([key, name]) => [key, env[name]])
    )
  )
}
