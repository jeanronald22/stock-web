import { expect, test, type Page } from "@playwright/test"

import {
  callApi,
  dismissTour,
  navigateTo,
  openNavigation,
  PASSWORD,
  redirectApi,
  shot,
  signUpWithBusiness,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

const NEW_PASSWORD = "deux cartons bien rangés"

async function openAccountMenu(page: Page) {
  await openNavigation(page)
  await page.getByRole("button", { name: "Ouvrir le menu du compte" }).click()
}

/**
 * « Mon profil » (D46) : ouvert depuis le menu du compte ; photo, nom et langue s'enregistrent
 * auprès de l'API, le mot de passe se change sur les pages de connexion de Kreskala.
 */
test("mon profil : photo, nom, langue et mot de passe", async ({
  page,
}, testInfo) => {
  test.slow()
  const email = await signUpWithBusiness(page, testInfo, "profil")
  await dismissTour(page, "Tout est ici")

  await openAccountMenu(page)
  await page.getByRole("menuitem", { name: "Mon profil" }).click()
  await expect(page).toHaveURL(/\/profil$/)
  await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible()
  await expect(page.getByLabel("Adresse e-mail")).toHaveValue(email)
  await shot(page, testInfo, "01-profil")

  // Le nom : obligatoire, puis enregistré, il change dans le menu du compte.
  await page.getByLabel("Prénom").fill(" ")
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click()
  await expect(page.getByText("À remplir pour continuer.")).toBeVisible()
  await page.getByLabel("Prénom").fill("Awa Marie")
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click()
  await expect(page.getByText("Nom enregistré.")).toBeVisible()

  // La photo, enregistrée dès le dépôt, remplace les initiales dans le menu du compte.
  const menuButton = page.getByRole("button", {
    name: "Ouvrir le menu du compte",
  })
  await page.locator('input[type="file"]').setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("pas une photo"),
  })
  await expect(
    page.getByText("Déposez une photo JPEG, PNG ou WebP.")
  ).toBeVisible()
  await page
    .locator('input[type="file"]')
    .setInputFiles("e2e/fixtures/carreau.png")
  await expect(page.getByText("Photo enregistrée.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Remplacer" })).toBeVisible()
  await openNavigation(page)
  await expect(menuButton.locator("img")).toBeVisible()
  await expect(menuButton).toContainText("Awa Marie Bello")
  await shot(page, testInfo, "02-photo")
  await page.keyboard.press("Escape")

  // Sur les bons, la photo accompagne le nom de qui a validé : dans la liste et sur le bon.
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Dépôt Akwa",
    kind: "WAREHOUSE",
  })
  const cement = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: cement,
    name: "Ciment 50 kg",
    baseUnit: "PIECE",
  })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    lines: [{ itemId: cement, quantity: 40 }],
  })
  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  const row = page.getByRole("row").filter({ hasText: "REC-" })
  await expect(
    row.getByText("Awa Marie Bello").filter({ visible: true })
  ).toBeVisible()
  await expect(row.locator("img").filter({ visible: true })).toBeVisible()
  await shot(page, testInfo, "02b-bons")
  await row.getByRole("link", { name: /^REC-/ }).click()
  const validator = page.locator("dd").filter({ hasText: "Awa Marie Bello" })
  await expect(validator.locator("img")).toBeVisible()
  await shot(page, testInfo, "02c-bon")
  await page.goto("/profil")

  // La langue change l'écran aussitôt, et reste après un rechargement : elle est au profil.
  await page.getByRole("button", { name: "English" }).click()
  await expect(page.getByRole("heading", { name: "My profile" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "My profile" })).toBeVisible()
  await shot(page, testInfo, "03-english")
  await page.getByRole("button", { name: "Français" }).click()
  await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible()

  // Mot de passe : Keycloak demande d'abord l'actuel, l'adresse pré-remplie. Abandonné, on revient
  // sans rien changer ; changé, un message le confirme.
  const confirmCurrent = async () => {
    await expect(
      page.getByRole("heading", { name: "Ravis de vous revoir" })
    ).toBeVisible()
    await expect(page.getByLabel("Adresse e-mail")).toHaveValue(email)
    await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD)
    await page.getByRole("button", { name: "Se connecter" }).click()
    await expect(
      page.getByRole("heading", { name: "Choisissez votre mot de passe" })
    ).toBeVisible()
  }
  await page.getByRole("button", { name: "Changer le mot de passe" }).click()
  await expect(
    page.getByRole("heading", { name: "Ravis de vous revoir" })
  ).toBeVisible()
  await shot(page, testInfo, "04-keycloak-actuel")
  await confirmCurrent()
  await shot(page, testInfo, "05-keycloak-nouveau")
  await page.getByRole("button", { name: "Annuler" }).click()
  await expect(page).toHaveURL(/\/profil$/)
  await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible()
  await expect(page.getByText("Mot de passe changé.")).toHaveCount(0)

  await page.getByRole("button", { name: "Changer le mot de passe" }).click()
  await confirmCurrent()
  await page.getByLabel("Mot de passe", { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel("Confirmez le mot de passe").fill(NEW_PASSWORD)
  await page.getByRole("button", { name: "Enregistrer et continuer" }).click()
  await expect(page).toHaveURL(/\/profil$/)
  await expect(page.getByText("Mot de passe changé.")).toBeVisible()
  await shot(page, testInfo, "06-mot-de-passe-change")

  // L'ancien mot de passe ne sert plus, le nouveau ouvre la session.
  await openAccountMenu(page)
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click()
  await page.goto("/connexion")
  await page.getByLabel("Adresse e-mail").fill(email)
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await expect(
    page.getByLabel("Mot de passe", { exact: true })
  ).toHaveAttribute("aria-invalid", "true")
  await page.getByLabel("Mot de passe", { exact: true }).fill(NEW_PASSWORD)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await expect(page.getByText(/^Bonjour Awa Marie,/)).toBeVisible()
})
