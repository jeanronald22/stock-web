import { expect, test } from "@playwright/test"

import { readLatestOtp } from "./otp"

const CAMEROON = "+237"

/** Nouveau numéro à chaque exécution : les envois sont limités par numéro. */
function randomLocalNumber(): string {
  return `6${Math.floor(10_000_000 + Math.random() * 89_999_999)}`
}

test("un nouveau client se connecte par code, crée sa structure et arrive sur l'accueil", async ({ page }, testInfo) => {
  // Les écrans s'animent à l'apparition : la capture attend leur état final.
  const shot = async (name: string) => {
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)))
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true })
  }
  const localNumber = randomLocalNumber()

  await page.goto("/connexion")
  await expect(page.getByRole("heading", { name: "Bienvenue" })).toBeVisible()
  await shot("01-numero")

  await page.getByLabel("Numéro de téléphone").fill(localNumber)
  await page.getByRole("button", { name: "Continuer" }).click()
  await expect(page.getByRole("heading", { name: "Saisissez le code" })).toBeVisible()
  await shot("02-code")

  await page.getByLabel(/Code à \d+ chiffres/).fill("000000")
  await page.getByRole("button", { name: "Valider" }).click()
  await expect(page.getByText("Code incorrect.")).toBeVisible()

  // La touche Entrée valide le code (et non « Modifier », placé plus haut dans la page).
  await page.getByLabel(/Code à \d+ chiffres/).fill(readLatestOtp(CAMEROON + localNumber))
  await page.getByLabel(/Code à \d+ chiffres/).press("Enter")

  await expect(page).toHaveURL(/\/bienvenue$/)
  await expect(page.getByRole("heading", { name: "Comment vous appelez-vous ?" })).toBeVisible()
  await page.getByRole("button", { name: "Continuer" }).click()
  await expect(page.getByText("Ce champ est obligatoire.").first()).toBeVisible()
  await shot("03-profil-erreurs")
  await page.getByLabel("Prénom").fill("Awa")
  await page.getByLabel("Nom", { exact: true }).fill("Bello")
  await shot("04-profil")
  await page.getByRole("button", { name: "Continuer" }).click()

  await expect(page.getByRole("heading", { name: "Parlez-nous de votre entreprise" })).toBeVisible()
  await page.getByLabel("Nom de l’entreprise").fill("Quincaillerie Bello")
  await page.getByLabel("Ville").fill("Douala")
  await page.getByLabel("Secteur d’activité").click()
  await page.getByRole("option", { name: "Quincaillerie" }).click()
  await shot("05-entreprise")
  await page.getByRole("button", { name: "Créer mon espace" }).click()

  await expect(page.getByRole("heading", { name: "Votre espace est prêt" })).toBeVisible()
  await shot("06-termine")
  await page.getByRole("button", { name: "Accéder à mon espace" }).click()

  await expect(page).toHaveURL(/\/accueil$/)
  await expect(page.getByRole("heading", { name: "Bonjour Awa" })).toBeVisible()
  await shot("07-accueil")

  // Revenir sur l'application mène directement à l'accueil : profil complet, entreprise retenue.
  await page.goto("/connexion")
  await expect(page).toHaveURL(/\/accueil$/)
})
