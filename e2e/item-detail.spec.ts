import { expect, test } from "@playwright/test"

import {
  callApi,
  dismissTour,
  navigateTo,
  redirectApi,
  shot,
  signUpWithBusiness,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

const year = new Date().getFullYear()

test("fiche article : le stock en grand, par dépôt, ses mouvements ; modifier est un écran à part", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "fiche-article")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
  })
  const tile = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tile,
    name: "Carreau 60x60",
    baseUnit: "PIECE",
    barcode: "6181234567890",
    packagings: [{ name: "Carton", quantity: 4 }],
    warehouses: [{ warehouseId: depot, minQuantity: 120 }],
  })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    lines: [{ itemId: tile, quantity: 102 }],
  })

  await navigateTo(page, "Articles")
  await page.getByRole("link", { name: /Carreau 60x60/ }).click()
  await expect(
    page.getByRole("heading", { name: "Carreau 60x60", level: 1 })
  ).toBeVisible()
  await expect(page.getByText("102", { exact: true })).toBeVisible()
  await expect(page.getByText("soit 25 × Carton + 2 pièces")).toBeVisible()
  await expect(page.getByText("Seuil d’alerte : 120 pièces")).toBeVisible()
  await expect(page.getByText("Stock bas")).toBeVisible()
  await expect(page.getByText("6181234567890")).toBeVisible()
  await expect(
    page.getByRole("link", { name: new RegExp(`REC-${year}-0001`) })
  ).toBeVisible()
  await shot(page, testInfo, "01-fiche")

  // Une sortie part avec l'article déjà sur le bon.
  await page.getByRole("button", { name: "Autres actions" }).click()
  await page
    .getByRole("menuitem", { name: "Nouvelle sortie de cet article" })
    .click()
  await expect(
    page.getByRole("textbox", { name: "Quantité · Carreau 60x60" })
  ).toBeVisible()
  await page
    .getByRole("textbox", { name: "Quantité · Carreau 60x60" })
    .fill("2")
  await page
    .getByRole("button", { name: "Valider la sortie · 1 article" })
    .click()
  await expect(page.getByText(`Sortie SOR-${year}-0001 validée.`)).toBeVisible()

  // Modifier : écran à part, retour à la fiche après l'enregistrement.
  await page.goto(`/articles/${tile}`)
  await expect(page.getByText("soit 25 × Carton")).toBeVisible()
  await expect(page.getByText("− 2 pièces")).toBeVisible()
  await page.getByRole("link", { name: "Modifier" }).click()
  await dismissTour(page, "L’unité de comptage")
  await expect(
    page.getByRole("heading", { name: "Modifier l’article" })
  ).toBeVisible()
  await page.locator("#name").fill("Carreau 60x60 gris")
  await page.getByRole("button", { name: "Enregistrer" }).click()
  await expect(page.getByText("Article enregistré.")).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Carreau 60x60 gris", level: 1 })
  ).toBeVisible()
  await shot(page, testInfo, "02-fiche-apres-modification")
})
