import { expect, test, type Page, type TestInfo } from "@playwright/test"

import { waitForActionLink } from "./mailbox"
import { recordViewTransitions } from "./view-transitions"

const PASSWORD = "un carton bien rangé"

/**
 * Les écrans s'animent à l'apparition : la capture attend leur état final. Les animations en boucle
 * des illustrations (carton qui flotte) ne finissent jamais et sont ignorées.
 */
async function shot(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished)
    )
  )
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true })
}

test("un nouveau client crée son compte, confirme son e-mail, choisit son mot de passe, crée sa structure, puis se reconnecte", async ({ page }, testInfo) => {
  const email = `awa.${Date.now()}.${testInfo.project.name}@exemple.cm`

  await page.goto("/connexion")
  await expect(page.getByRole("heading", { name: "Ravis de vous revoir" })).toBeVisible()
  await shot(page, testInfo, "01-connexion")
  await page.getByRole("link", { name: "Créer un compte" }).click()

  await expect(page.getByRole("heading", { name: "Créez votre compte" })).toBeVisible()
  await page.getByRole("button", { name: "Continuer" }).click()
  await expect(page.locator(".kk-field-error").first()).toBeVisible()
  await shot(page, testInfo, "02-inscription-erreur")
  await page.getByLabel("Adresse e-mail").fill(email)
  await page.getByRole("button", { name: "Continuer" }).click()

  await expect(page.getByRole("heading", { name: "Consultez vos e-mails" })).toBeVisible()
  await shot(page, testInfo, "03-verification")
  await page.goto(await waitForActionLink(email))

  // Le mot de passe se choisit après la confirmation de l'adresse (Keycloak, sécurité).
  await expect(page.getByRole("heading", { name: "Choisissez votre mot de passe" })).toBeVisible()
  await page.getByLabel("Mot de passe", { exact: true }).fill("court")
  await page.getByLabel("Confirmez le mot de passe").fill("court")
  await page.getByRole("button", { name: "Enregistrer et continuer" }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await shot(page, testInfo, "04-mot-de-passe-erreur")
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD)
  await page.getByLabel("Confirmez le mot de passe").fill(PASSWORD)
  await page.getByRole("button", { name: "Enregistrer et continuer" }).click()

  await expect(page).toHaveURL(/\/bienvenue$/)
  await expect(page.getByLabel("Prénom")).toBeVisible()
  const transitions = await recordViewTransitions(page)
  await page.getByLabel("Prénom").fill("Awa")
  await page.getByLabel("Nom", { exact: true }).fill("Bello")
  await page.getByRole("button", { name: "Continuer" }).click()

  await expect(page.getByRole("heading", { name: "Quelle entreprise gérez-vous ?" })).toBeVisible()
  // Le passage d'étape est animé vers l'avant, le retour vers l'arrière.
  await expect.poll(transitions).toEqual(["step-forward"])
  await page.getByRole("button", { name: "Retour" }).click()
  await expect(page.getByLabel("Prénom")).toHaveValue("Awa")
  await expect.poll(transitions).toEqual(["step-forward", "step-back"])
  await page.getByRole("button", { name: "Continuer" }).click()
  await expect(page.getByRole("heading", { name: "Quelle entreprise gérez-vous ?" })).toBeVisible()
  await page.getByLabel("Nom de l’entreprise").fill("Quincaillerie Bello")
  await page.getByLabel("Ville").fill("Douala")
  await page.getByLabel("Activité").click()
  await page.getByRole("option", { name: "Quincaillerie" }).click()
  await page.getByRole("button", { name: "Créer mon espace" }).click()
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click()

  await expect(page.getByRole("heading", { name: "Bonjour Awa" })).toBeVisible()
  await shot(page, testInfo, "05-accueil")

  // Déconnexion, puis retour par e-mail et mot de passe : directement sur l'accueil.
  await page.getByRole("button", { name: "Ouvrir le menu du compte" }).click()
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click()
  await page.goto("/connexion")
  await expect(page.getByRole("heading", { name: "Ravis de vous revoir" })).toBeVisible()
  await page.getByLabel("Adresse e-mail").fill(email)
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD)
  await page.getByLabel("Mot de passe", { exact: true }).press("Enter")
  await expect(page).toHaveURL(/\/accueil$/)
})
