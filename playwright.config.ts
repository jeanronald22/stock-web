import { defineConfig, devices } from "@playwright/test"

/**
 * Parcours de bout en bout contre une pile réelle (Keycloak, API, application web), lancée à
 * part : voir e2e/README.md.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  // Parcours complet : inscription, e-mail, mot de passe, deux écrans, accueil, reconnexion.
  timeout: 90_000,
  reporter: [["list"]],
  // Le serveur de développement compile chaque écran à sa première visite.
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    locale: "fr-FR",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
})
