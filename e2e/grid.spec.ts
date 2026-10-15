import path from "node:path"

import { expect, test } from "@playwright/test"

import {
  callApi,
  dismissTour,
  navigateTo,
  redirectApi,
  shot,
  signUpWithBusiness,
  uploadItemPhoto,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

test("articles et stock en grille : photos, quantités, état ; le choix reste dans l'adresse", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "grille")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
  })
  const tile = crypto.randomUUID()
  const tap = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tile,
    name: "Carreau 60x60 beige",
    reference: "CAR-6060",
    baseUnit: "PIECE",
    packagings: [{ name: "Carton", quantity: 4 }],
    warehouses: [{ warehouseId: depot, minQuantity: 20 }],
  })
  await callApi(page, "POST", "/v1/items", {
    id: tap,
    name: "Robinet mélangeur",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: depot, minQuantity: 2 }],
  })
  await uploadItemPhoto(
    page,
    tile,
    path.join(import.meta.dirname, "fixtures/carreau.png")
  )
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    lines: [{ itemId: tile, quantity: 102 }],
  })

  await navigateTo(page, "Articles")
  await dismissTour(page, "Votre catalogue")
  await page.getByRole("button", { name: "Afficher en grille" }).click()
  await expect(page).toHaveURL(/vue=grille/)
  await expect(
    page.getByRole("link", { name: "Carreau 60x60 beige" })
  ).toBeVisible()
  await expect(page.getByText("CAR-6060")).toBeVisible()
  await shot(page, testInfo, "01-articles-grille")

  await navigateTo(page, "Stock")
  await dismissTour(page, "Dépôt par dépôt")
  await page.getByRole("button", { name: "Afficher en grille" }).click()
  await expect(page.getByText("25 × Carton + 2 pièces")).toBeVisible()
  await expect(page.getByText("Rupture")).toBeVisible()
  await shot(page, testInfo, "02-stock-grille")

  // Rechargée, la page garde la grille ; une carte ouvre la fiche.
  await page.reload()
  await expect(
    page.getByRole("button", { name: "Afficher en grille" })
  ).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("link", { name: "Robinet mélangeur" }).click()
  await expect(
    page.getByRole("heading", { name: "Robinet mélangeur", level: 1 })
  ).toBeVisible()
})
