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

test("transfert : envoyé d'un dépôt, en route, réceptionné à l'arrivée avec un écart", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "transferts")
  await dismissTour(page, "Tout est ici")
  const bonaberi = crypto.randomUUID()
  const akwa = crypto.randomUUID()
  for (const [id, name] of [
    [bonaberi, "Dépôt Bonabéri"],
    [akwa, "Boutique Akwa"],
  ])
    await callApi(page, "POST", "/v1/warehouses", {
      id,
      name,
      kind: "WAREHOUSE",
    })
  const cable = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: cable,
    name: "Câble 2,5 mm²",
    baseUnit: "METRE",
    warehouses: [{ warehouseId: bonaberi, minQuantity: null }],
  })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: bonaberi,
    lines: [{ itemId: cable, quantity: 100 }],
  })

  // Envoi, depuis l'écran des bons : départ, arrivée, articles.
  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  await page.getByRole("button", { name: "Autre opération" }).first().click()
  await page.getByRole("menuitem", { name: /Transfert/ }).click()
  await expect(
    page.getByRole("heading", { name: "Nouveau transfert" })
  ).toBeVisible()
  await page.getByRole("combobox", { name: "Dépôt de départ" }).click()
  await page.getByRole("option", { name: "Dépôt Bonabéri" }).click()
  await page.getByRole("combobox", { name: "Dépôt d’arrivée" }).click()
  await expect(
    page.getByRole("option", { name: "Dépôt Bonabéri" })
  ).toBeHidden()
  await page.getByRole("option", { name: "Boutique Akwa" }).click()
  await page
    .getByRole("searchbox", { name: "Rechercher un article à ajouter" })
    .fill("Câble")
  await page.getByRole("button", { name: /Câble 2,5 mm²/ }).click()
  await expect(page.getByText("Disponible : 100 m")).toBeVisible()
  await page
    .getByRole("textbox", { name: "Quantité · Câble 2,5 mm²" })
    .fill("30")
  await shot(page, testInfo, "01-transfert")
  await page
    .getByRole("button", { name: "Envoyer le transfert · 1 article" })
    .click()
  await expect(
    page.getByText(`Transfert TRS-${year}-0001 envoyé.`)
  ).toBeVisible()

  // En route : visible dans les bons et sur le tableau de bord.
  await navigateTo(page, "Tableau de bord")
  await expect(page.getByText("1 transfert à réceptionner")).toBeVisible()
  await navigateTo(page, "Bons")
  await page.getByRole("button", { name: /^Transferts en route/ }).click()
  const row = page.getByRole("row").filter({ hasText: `TRS-${year}-0001` })
  await expect(row).toContainText("Dépôt Bonabéri → Boutique Akwa")
  await expect(row).toContainText("En route")
  await row.getByRole("link", { name: `TRS-${year}-0001` }).click()

  // Réception : 28 m arrivés sur 30.
  await page.getByRole("link", { name: "Réceptionner" }).click()
  await expect(page.getByText("Envoyé : 30 m")).toBeVisible()
  await page.getByRole("textbox", { name: "Quantité reçue" }).fill("28")
  await expect(page.getByText("Manque : 2 m")).toBeVisible()
  await shot(page, testInfo, "02-reception")
  await page.getByRole("button", { name: "Valider la réception" }).click()
  // Une perte en route se confirme : la réception ne se modifiera plus (D50).
  const review = page.getByRole("alertdialog")
  await expect(
    review.getByText("Câble 2,5 mm² : reçu 28 m, envoyé 30 m")
  ).toBeVisible()
  await review.getByRole("button", { name: "Valider quand même" }).click()
  await expect(
    page.getByRole("heading", { name: `TRE-${year}-0001` })
  ).toBeVisible()
  await expect(page.getByText("Envoyé : 30 m")).toBeVisible()
  await page.getByRole("link", { name: `TRS-${year}-0001` }).click()
  await expect(page.getByText("Reçu", { exact: true })).toBeVisible()
  await shot(page, testInfo, "03-transfert-recu")
})
