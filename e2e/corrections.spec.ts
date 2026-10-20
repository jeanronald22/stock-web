import { expect, test, type Page } from "@playwright/test"

import {
  callApi,
  dismissTour,
  navigateTo,
  redirectApi,
  shot,
  signUpWithBusiness,
  withFilters,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

const year = new Date().getFullYear()

/** Image PNG de 1 × 1 pixel : une vraie photo n'apporterait rien au scénario. */
const PHOTO = {
  name: "casse.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  ),
}

/** Un dépôt, un carreau vendu à la pièce ou au carton de 4, 100 pièces en stock. */
async function stockedTile(page: Page) {
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
    packagings: [{ name: "Carton", quantity: 4 }],
    warehouses: [{ warehouseId: depot, minQuantity: null }],
  })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    lines: [{ itemId: tile, quantity: 100 }],
  })
}

async function openOperation(page: Page, name: RegExp) {
  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  await page.getByRole("button", { name: "Autre opération" }).first().click()
  await page.getByRole("menuitem", { name }).click()
}

async function addTile(page: Page) {
  await page
    .getByRole("searchbox", { name: "Rechercher un article à ajouter" })
    .fill("Carreau")
  await page.getByRole("button", { name: /Carreau 60x60/ }).click()
}

test("casse : motif obligatoire, note pour « autre », photos gardées comme preuves", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "casse")
  await dismissTour(page, "Tout est ici")
  await stockedTile(page)

  await openOperation(page, /Casse/)
  await expect(
    page.getByRole("heading", { name: "Nouvelle casse" })
  ).toBeVisible()
  await addTile(page)
  await page
    .getByRole("textbox", { name: "Quantité · Carreau 60x60" })
    .fill("2")
  const submit = page.getByRole("button", {
    name: "Enregistrer la casse · 1 article",
  })

  // Sans motif, puis « autre » sans note : refusé avant l'envoi.
  await submit.click()
  await expect(page.getByText("Choisissez un motif.")).toBeVisible()
  await page.getByRole("radio", { name: /Autre/ }).click()
  await submit.click()
  await expect(page.getByText("Expliquez ce qui s’est passé.")).toBeVisible()

  await page.getByRole("radio", { name: /Cassé/ }).click()
  await page.getByLabel("Ajouter une photo").setInputFiles(PHOTO)
  await expect(page.getByRole("img", { name: "Photo 1" })).toBeVisible()
  await shot(page, testInfo, "01-casse")
  await submit.click()
  await expect(
    page.getByText(`Casse CAS-${year}-0001 enregistrée.`)
  ).toBeVisible()

  // La fiche : motif, sortie, photo ; une deuxième photo s'ajoute après coup.
  await page.getByRole("button", { name: "Voir le bon" }).click()
  await expect(
    page.getByRole("heading", { name: `CAS-${year}-0001` })
  ).toBeVisible()
  await expect(page.getByText("Cassé", { exact: true })).toBeVisible()
  await expect(page.getByText("− 2 pièces")).toBeVisible()
  await expect(page.getByText("1 sur 5")).toBeVisible()
  await page.getByLabel("Ajouter une photo").setInputFiles(PHOTO)
  await expect(page.getByText("2 sur 5")).toBeVisible()
  await shot(page, testInfo, "02-fiche-casse")
})

test("ajustement : le stock prend la quantité comptée, l'écart avec le théorique reste visible", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "ajustement")
  await dismissTour(page, "Tout est ici")
  await stockedTile(page)

  await openOperation(page, /Ajustement de stock/)
  await addTile(page)
  await expect(page.getByText("Théorique : 100 pièces")).toBeVisible()
  const counted = page.getByRole("textbox", { name: "Compté · Carreau 60x60" })
  await counted.fill("100")
  await expect(page.getByText("Conforme")).toBeVisible()
  await counted.fill("23")
  await page.getByRole("combobox", { name: /Unité/ }).click()
  await page.getByRole("option", { name: /Carton/ }).click()
  await expect(page.getByText("Écart : −8 pièces")).toBeVisible()
  await page.getByRole("radio", { name: /Comptage/ }).click()
  await shot(page, testInfo, "01-ajustement")
  await page
    .getByRole("button", { name: "Valider le comptage · 1 article" })
    .click()
  await expect(
    page.getByText(`Ajustement AJU-${year}-0001 validé.`)
  ).toBeVisible()

  await page.getByRole("button", { name: "Voir le bon" }).click()
  await expect(page.getByText("− 8 pièces")).toBeVisible()
  await expect(
    page.getByText("Théorique 100 pièces, compté 92 pièces")
  ).toBeVisible()
  await shot(page, testInfo, "02-fiche-ajustement")
})

test("réception comparée au bon de livraison : l'écart se voit et se retrouve par le filtre", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "ecart-reception")
  await dismissTour(page, "Tout est ici")
  await stockedTile(page)

  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  await page.getByRole("link", { name: "Réception" }).first().click()
  await page
    .getByRole("switch", { name: "Comparer au bon de livraison" })
    .click()
  await addTile(page)
  await page
    .getByRole("textbox", { name: "Quantité · Carreau 60x60" })
    .fill("10")
  await page
    .getByRole("textbox", { name: "Annoncé (BL) · Carreau 60x60" })
    .fill("12")
  await expect(page.getByText("Écart : −2 pièces")).toBeVisible()
  await shot(page, testInfo, "01-reception-ecart")
  await page.getByRole("button", { name: /Valider la réception/ }).click()
  await expect(
    page.getByText(`Réception REC-${year}-0002 validée.`)
  ).toBeVisible()

  await navigateTo(page, "Bons")
  await withFilters(page, async () => {
    await page.getByRole("combobox", { name: "Tous les bons" }).click()
    await page.getByRole("option", { name: "Réceptions avec écart" }).click()
  })
  const rows = page.getByRole("row").filter({ hasText: `REC-${year}-` })
  await expect(rows).toHaveCount(1)
  await expect(rows).toContainText("Écart")
  await rows.getByRole("link", { name: `REC-${year}-0002` }).click()
  await expect(page.getByText("Annoncé : 12 pièces")).toBeVisible()
  await shot(page, testInfo, "02-fiche-reception")
})
