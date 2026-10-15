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

test("fiches dépôt et fournisseur : à commander, dernière livraison, écart à réclamer ; modifier à part", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "fiches")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
    city: "Douala",
  })
  const supplier = crypto.randomUUID()
  await callApi(page, "POST", "/v1/suppliers", {
    id: supplier,
    name: "Céramiques du Littoral",
    phone: "+237 6 99 00 11 22",
    itemIds: [],
  })
  const tile = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tile,
    name: "Carreau 60x60",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: depot, minQuantity: 50 }],
  })
  // Une réception de 40 sur 48 annoncés : écart à réclamer, et stock sous le seuil de 50.
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    supplierId: supplier,
    lines: [{ itemId: tile, quantity: 40, expectedQuantity: 48 }],
  })

  await navigateTo(page, "Dépôts")
  await dismissTour(page, "Vos lieux de stock")
  await page.getByRole("link", { name: /Dépôt Bonabéri/ }).click()
  await expect(
    page.getByRole("heading", { name: "Dépôt Bonabéri", level: 1 })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "1 article à commander" })
  ).toBeVisible()
  await expect(page.getByText("Seuil : 50 pièces")).toBeVisible()
  await expect(
    page.getByRole("link", { name: new RegExp(`REC-${year}-0001`) })
  ).toBeVisible()
  await shot(page, testInfo, "01-fiche-depot")

  // Une sortie part de la fiche, dépôt déjà choisi.
  await page.getByRole("button", { name: "Autres actions" }).click()
  await page
    .getByRole("menuitem", { name: "Nouvelle sortie de ce dépôt" })
    .click()
  await expect(page.getByRole("combobox", { name: "Dépôt" })).toContainText(
    "Dépôt Bonabéri"
  )

  await navigateTo(page, "Contacts")
  await dismissTour(page, "Vos fournisseurs")
  await page.getByRole("link", { name: "Céramiques du Littoral" }).click()
  await expect(page.getByText("Dernière livraison")).toBeVisible()
  await expect(page.getByText("1 réception en tout")).toBeVisible()
  await expect(
    page.getByRole("link", { name: "1 réception avec écart, à réclamer" })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
    "href",
    "https://wa.me/237699001122"
  )
  await expect(page.getByRole("link", { name: "Carreau 60x60" })).toBeVisible()
  await shot(page, testInfo, "02-fiche-fournisseur")

  // Modifier : écran à part, retour à la fiche après l'enregistrement.
  await page.getByRole("link", { name: "Modifier" }).click()
  await expect(
    page.getByRole("heading", { name: "Modifier le fournisseur" })
  ).toBeVisible()
  await page.locator("#name").fill("Céramiques du Littoral SARL")
  await page.getByRole("button", { name: "Enregistrer" }).click()
  await expect(
    page.getByRole("heading", { name: "Céramiques du Littoral SARL", level: 1 })
  ).toBeVisible()
})
