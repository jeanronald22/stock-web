import { expect, test } from "@playwright/test"

import {
  callApi,
  dismissTour,
  itemCard,
  pickPeriod,
  navigateTo,
  redirectApi,
  shot,
  signUpWithBusiness,
  withFilters,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

test("catégories, seuils d'alerte et filtres combinables", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "alertes")
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
  const breaker = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: cable,
    name: "Câble rigide 2,5 mm²",
    baseUnit: "METRE",
    warehouses: [{ warehouseId: bonaberi, minQuantity: null }],
  })
  await callApi(page, "POST", "/v1/items", {
    id: breaker,
    name: "Disjoncteur 16 A",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: akwa, minQuantity: 0 }],
  })
  await callApi(page, "POST", "/v1/items", {
    id: crypto.randomUUID(),
    name: "Ciment CPJ 42,5",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: akwa, minQuantity: null }],
  })
  const receive = (occurredAt: string) =>
    callApi(page, "POST", "/v1/vouchers", {
      id: crypto.randomUUID(),
      type: "RECEIPT",
      warehouseId: bonaberi,
      occurredAt,
      lines: [{ itemId: cable, quantity: 80 }],
    })
  await receive("2026-03-02T09:00:00Z")
  await receive("2026-04-10T09:00:00Z")

  // Catégories : une famille et sa sous-famille, créées sans quitter la liste.
  await navigateTo(page, "Articles")
  await dismissTour(page, "Votre catalogue")
  await page.getByTestId("categories-open").click()
  const sheet = page.getByRole("dialog", { name: "Catégories d’articles" })
  await sheet
    .getByRole("textbox", { name: "Nom de la catégorie" })
    .fill("Électricité")
  await sheet.getByRole("button", { name: "Ajouter" }).click()
  await expect(
    sheet.getByRole("listitem").filter({ hasText: "Électricité" })
  ).toBeVisible()
  await sheet.getByRole("button", { name: "Actions pour Électricité" }).click()
  await page
    .getByRole("menuitem", { name: "Ajouter une sous-catégorie" })
    .click()
  await sheet
    .getByRole("textbox", { name: "Nom de la catégorie" })
    .fill("Câbles")
  await sheet.getByRole("button", { name: "Ajouter" }).click()
  await expect(
    sheet.getByRole("listitem").filter({ hasText: "Câbles" })
  ).toBeVisible()
  await shot(page, testInfo, "01-categories")
  await page.keyboard.press("Escape")

  // Le câble est rangé dans « Électricité › Câbles », avec un seuil de 200 m à Bonabéri.
  await page.getByRole("link", { name: /Câble rigide/ }).click()
  await page.getByRole("link", { name: "Modifier" }).click()
  await dismissTour(page, "L’unité de comptage")
  await page.getByRole("combobox", { name: /Catégorie/ }).click()
  await page.getByRole("option", { name: "Câbles" }).click()
  await page.getByRole("textbox", { name: "Seuil d’alerte" }).fill("200")
  await page.getByRole("button", { name: "Enregistrer" }).click()
  await expect(page.getByText("Article enregistré.")).toBeVisible()

  // Filtre par catégorie parente : les sous-catégories sont comprises.
  await navigateTo(page, "Articles")
  await withFilters(page, async () => {
    await page.getByRole("combobox", { name: "Filtrer par catégorie" }).click()
    await page.getByRole("option", { name: "Électricité", exact: true }).click()
  })
  await expect(page.getByRole("link", { name: /Câble rigide/ })).toBeVisible()
  await expect(page.getByRole("link", { name: /Ciment/ })).toBeHidden()
  await expect(page.getByText("Électricité › Câbles")).toBeVisible()
  await withFilters(page, () =>
    page.getByRole("button", { name: "Effacer les filtres" }).click()
  )
  await expect(page.getByRole("link", { name: /Ciment/ })).toBeVisible()

  // Stock : 160 m pour un seuil de 200 : stock bas ; le disjoncteur, seuil 0, est en rupture.
  await navigateTo(page, "Stock")
  await dismissTour(page, "Dépôt par dépôt")
  await page.getByRole("button", { name: /^À commander/ }).click()
  const cableCard = itemCard(page, /Câble rigide/)
  await expect(cableCard.getByText("Stock bas")).toBeVisible()
  await expect(
    cableCard.getByText(/Dépôt Bonabéri : 160 m, seuil 200 m/)
  ).toBeVisible()
  await expect(itemCard(page, /Disjoncteur/).getByText("Rupture")).toBeVisible()
  await expect(itemCard(page, /Ciment/)).toBeHidden()
  await shot(page, testInfo, "02-stock-alertes")

  // Entreprise active dans la barre du haut ; la création d'une autre est l'action principale.
  await page.getByRole("button", { name: "Changer d’entreprise" }).click()
  await expect(
    page.getByRole("button", { name: "Créer une autre entreprise" })
  ).toBeVisible()
  await shot(page, testInfo, "02b-entreprises")
  await page.keyboard.press("Escape")

  // L'accueil annonce les articles à commander.
  await navigateTo(page, "Accueil")
  await expect(page.getByTestId("stock-alerts")).toContainText(
    "2 articles à commander"
  )

  // Bons : période et ordre.
  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  const rows = page.getByRole("row").filter({ hasText: "REC-" })
  await expect(rows).toHaveCount(2)
  await pickPeriod(page, "Période des bons", "2026-04-01", "2026-04-30", () =>
    shot(page, testInfo, "03a-periode")
  )
  await expect(rows).toHaveCount(1)
  await page.getByRole("button", { name: /^Période des bons/ }).click()
  await page.getByRole("button", { name: "Effacer", exact: true }).click()
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toContainText("REC-2026-0002")
  await page.getByRole("button", { name: "Plus récents d’abord" }).click()
  await expect(rows.first()).toContainText("REC-2026-0001")
  await shot(page, testInfo, "03-bons-periode")
})
