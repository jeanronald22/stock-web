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
const next = (page: Page) =>
  page.getByRole("button", { name: "Continuer" }).click()

async function addItem(page: Page, name: string) {
  await page
    .getByRole("searchbox", { name: "Rechercher un article à ajouter" })
    .fill(name.split(" ")[0])
  await page.getByRole("button", { name: new RegExp(name) }).click()
}

test("réception puis sortie : le stock suit, une sortie trop forte est refusée", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "bons")
  await dismissTour(page, "Tout est ici")

  const warehouseId = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: warehouseId,
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
  })
  await callApi(page, "POST", "/v1/items", {
    id: crypto.randomUUID(),
    name: "Ciment CPJ 42,5",
    baseUnit: "PIECE",
    packagings: [{ name: "Palette", quantity: 40 }],
    warehouseIds: [warehouseId],
  })
  await callApi(page, "POST", "/v1/items", {
    id: crypto.randomUUID(),
    name: "Carreau 60x60 beige",
    baseUnit: "SQUARE_METRE",
    batchTracking: true,
    packagings: [{ name: "Carton", quantity: 1.44 }],
    warehouseIds: [warehouseId],
  })

  await navigateTo(page, "Bons")
  await expect(
    page.getByRole("heading", { name: "Aucun bon pour l’instant" })
  ).toBeVisible()
  await dismissTour(page, "Entrées et sorties")

  // Réception : 2 palettes de ciment (80 sacs) et 10 cartons de carreaux, lot N12 (14,4 m²).
  await page.getByRole("link", { name: "Nouvelle réception" }).first().click()
  await expect(
    page.getByRole("heading", {
      name: "Dans quel dépôt arrive la marchandise ?",
    })
  ).toBeVisible()
  // Dépôt unique : déjà choisi.
  await expect(
    page.getByRole("radio", { name: /Dépôt Bonabéri/ })
  ).toHaveAttribute("aria-checked", "true")
  await next(page)
  await addItem(page, "Ciment CPJ 42,5")
  await page
    .getByRole("textbox", { name: "Quantité · Ciment CPJ 42,5" })
    .fill("2")
  await page.getByRole("combobox", { name: "Unité · Ciment CPJ 42,5" }).click()
  await page.getByRole("option", { name: "Palette (40 pièces)" }).click()
  await expect(page.getByText("= 80 pièces")).toBeVisible()
  await addItem(page, "Carreau 60x60 beige")
  await page
    .getByRole("textbox", { name: "Quantité · Carreau 60x60 beige" })
    .fill("10")
  await page
    .getByRole("combobox", { name: "Unité · Carreau 60x60 beige" })
    .click()
  await page.getByRole("option", { name: /Carton/ }).click()
  await next(page)
  await expect(page.getByText("Indiquez le lot.")).toBeVisible()
  await page
    .getByRole("textbox", { name: "Lot · Carreau 60x60 beige" })
    .fill("N12")
  await shot(page, testInfo, "01-reception-articles")
  await next(page)
  await page.getByLabel(/Fournisseur/).fill("Cimencam")
  await next(page)
  await expect(page.getByText("+ 80 pièces")).toBeVisible()
  await expect(page.getByText("+ 14,4 m²")).toBeVisible()
  await shot(page, testInfo, "02-reception-recapitulatif")
  await page.getByRole("button", { name: "Valider la réception" }).click()
  await expect(
    page.getByRole("heading", { name: `REC-${year}-0001` })
  ).toBeVisible()
  await expect(page.locator("dl").getByText("Awa Bello")).toBeVisible()
  await shot(page, testInfo, "03-bon-reception")

  // Sortie de 100 sacs : il n'y en a que 80, l'assistant revient sur la ligne.
  await navigateTo(page, "Bons")
  await page.getByRole("link", { name: "Nouvelle sortie" }).click()
  await next(page)
  await addItem(page, "Ciment CPJ 42,5")
  await expect(page.getByText("Disponible : 80 pièces")).toBeVisible()
  await page
    .getByRole("textbox", { name: "Quantité · Ciment CPJ 42,5" })
    .fill("100")
  await next(page)
  await next(page)
  await page.getByRole("button", { name: "Valider la sortie" }).click()
  await expect(
    page.getByText("Il n’y a que 80 pièces dans ce dépôt.")
  ).toBeVisible()
  await shot(page, testInfo, "04-sortie-refusee")
  await page
    .getByRole("textbox", { name: "Quantité · Ciment CPJ 42,5" })
    .fill("30")
  await next(page)
  await next(page)
  await page.getByRole("button", { name: "Valider la sortie" }).click()
  await expect(
    page.getByRole("heading", { name: `SOR-${year}-0001` })
  ).toBeVisible()

  // Stock : 50 sacs de ciment, 14,4 m² de carreaux du lot N12.
  await navigateTo(page, "Stock")
  await dismissTour(page, "Dépôt par dépôt")
  await expect(
    page.getByRole("row", { name: /Ciment CPJ 42,5.*50 pièces/ })
  ).toBeVisible()
  await expect(
    page.getByRole("row", { name: /Carreau 60x60 beige.*14,4 m²/ })
  ).toBeVisible()
  await shot(page, testInfo, "05-stock")

  await navigateTo(page, "Bons")
  await expect(page.getByText("1–2 sur 2")).toBeVisible()
  await shot(page, testInfo, "06-bons")
})
