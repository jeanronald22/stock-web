import { expect, test, type Page } from "@playwright/test"

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

async function depot(page: Page) {
  const id = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id,
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
  })
  return id
}

test("code-barres : la douchette ajoute l'article, un second passage ajoute une unité, un code inconnu propose de créer l'article", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "codebarres")
  await dismissTour(page, "Tout est ici")
  const warehouse = await depot(page)
  await callApi(page, "POST", "/v1/items", {
    id: crypto.randomUUID(),
    name: "Ciment 50 kg",
    baseUnit: "PIECE",
    barcode: "6181234567890",
    warehouses: [{ warehouseId: warehouse, minQuantity: null }],
  })

  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  await page.getByRole("link", { name: "Nouvelle réception" }).first().click()
  const search = page.getByRole("searchbox", {
    name: "Rechercher un article à ajouter",
  })
  // Une douchette tape le code puis Entrée.
  await search.fill("6181234567890")
  await search.press("Enter")
  const quantity = page.getByRole("textbox", {
    name: "Quantité · Ciment 50 kg",
  })
  await expect(quantity).toHaveValue("1")
  await search.fill("6181234567890")
  await search.press("Enter")
  await expect(quantity).toHaveValue("2")
  await shot(page, testInfo, "01-douchette")

  // Code inconnu : on le dit, et l'on peut créer l'article avec ce code.
  await page.getByRole("button", { name: "Scanner un article" }).click()
  await page.getByRole("textbox", { name: "Code-barres" }).fill("6189999999999")
  await page.getByRole("button", { name: "Valider" }).click()
  await expect(
    page.getByText("Code 6189999999999 inconnu : aucun article ne le porte.")
  ).toBeVisible()
  await page.getByRole("link", { name: "Créer l’article" }).click()
  await expect(page.getByLabel(/Code-barres/)).toHaveValue("6189999999999")
})

test("lots : nuance et calibre à la réception, mélange de nuances signalé à la sortie", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "nuances")
  await dismissTour(page, "Tout est ici")
  const warehouse = await depot(page)
  await callApi(page, "POST", "/v1/items", {
    id: crypto.randomUUID(),
    name: "Carreau 60x60",
    baseUnit: "PIECE",
    batchTracking: true,
    warehouses: [{ warehouseId: warehouse, minQuantity: null }],
  })

  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  await page.getByRole("link", { name: "Nouvelle réception" }).first().click()
  for (const [batch, shade] of [
    ["L2409", "B2"],
    ["L2410", "B3"],
  ]) {
    await page
      .getByRole("searchbox", { name: "Rechercher un article à ajouter" })
      .fill("Carreau")
    await page.getByRole("button", { name: /^Carreau 60x60/ }).click()
    const lines = page
      .getByRole("listitem")
      .filter({ hasText: "Carreau 60x60" })
    const line = lines.last()
    await line
      .getByRole("textbox", { name: "Quantité · Carreau 60x60" })
      .fill("40")
    await line.getByRole("textbox", { name: /^Lot/ }).fill(batch)
    await line
      .getByRole("textbox", { name: "Nuance · Carreau 60x60" })
      .fill(shade)
    await line
      .getByRole("textbox", { name: "Calibre · Carreau 60x60" })
      .fill("9")
  }
  await shot(page, testInfo, "01-reception-nuances")
  await page
    .getByRole("button", { name: /Valider la réception · 2 articles/ })
    .click()
  await expect(
    page.getByText(`Réception REC-${year}-0001 validée.`)
  ).toBeVisible()

  // Sortie : les lots se choisissent avec leur nuance ; en mélanger deux est signalé.
  await navigateTo(page, "Bons")
  await page.getByRole("link", { name: "Nouvelle sortie" }).first().click()
  for (const option of [
    /L2409 · nuance B2 · cal\. 9/,
    /L2410 · nuance B3 · cal\. 9/,
  ]) {
    await page
      .getByRole("searchbox", { name: "Rechercher un article à ajouter" })
      .fill("Carreau")
    await page.getByRole("button", { name: /^Carreau 60x60/ }).click()
    const line = page
      .getByRole("listitem")
      .filter({ hasText: "Carreau 60x60" })
      .last()
    await line
      .getByRole("textbox", { name: "Quantité · Carreau 60x60" })
      .fill("5")
    await line.getByRole("combobox", { name: "Lot · Carreau 60x60" }).click()
    await page.getByRole("option", { name: option }).click()
  }
  await expect(
    page.getByText("Carreau 60x60 : 2 nuances différentes sur ce bon.")
  ).toBeVisible()
  await shot(page, testInfo, "02-melange-signale")
  await page
    .getByRole("button", { name: /Valider la sortie · 2 articles/ })
    .click()
  await expect(page.getByText(`Sortie SOR-${year}-0001 validée.`)).toBeVisible()
  await page
    .getByRole("listitem")
    .filter({ hasText: `Sortie SOR-${year}-0001 validée.` })
    .getByRole("button", { name: "Voir le bon" })
    .click()
  await expect(
    page
      .getByText("L2409 · nuance B2 · cal. 9")
      .filter({ visible: true })
      .first()
  ).toBeVisible()
})
