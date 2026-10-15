import { expect, test } from "@playwright/test"

import {
  callApi,
  dismissTour,
  navigateTo,
  redirectApi,
  shot,
  signUpWithBusiness,
} from "./support"
import { joinTeam } from "./team-member"

test.beforeEach(async ({ context }) => redirectApi(context))

const year = new Date().getFullYear()

test("accueil par rôle, rapports de mouvements, casse et écarts, exports Excel", async ({
  page,
  browser,
}, testInfo) => {
  test.slow()
  await signUpWithBusiness(page, testInfo, "rapports")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Magasin Akwa",
    kind: "SHOP",
  })
  const tile = crypto.randomUUID()
  const cement = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tile,
    name: "Carreau 60x60",
    baseUnit: "PIECE",
    packagings: [{ name: "Carton", quantity: 4 }],
    warehouses: [{ warehouseId: depot, minQuantity: 200 }],
  })
  await callApi(page, "POST", "/v1/items", {
    id: cement,
    name: "Ciment 50 kg",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: depot }],
  })
  const supplier = crypto.randomUUID()
  await callApi(page, "POST", "/v1/suppliers", {
    id: supplier,
    name: "Céramiques du Littoral",
  })
  const voucher = (body: Record<string, unknown>) =>
    callApi(page, "POST", "/v1/vouchers", {
      id: crypto.randomUUID(),
      warehouseId: depot,
      ...body,
    })
  await voucher({
    type: "RECEIPT",
    supplierId: supplier,
    lines: [
      {
        itemId: tile,
        quantity: 25,
        expectedQuantity: 26,
        packagingName: "Carton",
      },
      { itemId: cement, quantity: 40 },
    ],
  })
  await voucher({
    type: "ISSUE",
    lines: [
      { itemId: tile, quantity: 30 },
      { itemId: cement, quantity: 5 },
    ],
  })
  await voucher({
    type: "DAMAGE",
    reason: "BROKEN",
    lines: [{ itemId: tile, quantity: 2 }],
  })

  // Gérant : l'activité de ses dépôts, les plus sortis, la casse par motif.
  // Bons créés par l'API : l'accueil déjà ouvert est rechargé, comme en y revenant.
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Activité de vos dépôts" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Les plus sortis" })
  ).toBeVisible()
  await expect(
    page.getByRole("listitem").filter({ hasText: "100 %" })
  ).toBeVisible()
  await expect(page.getByText("1 article à commander")).toBeVisible()
  await shot(page, testInfo, "01-accueil-gerant")

  // La tuile « Casse » ouvre le rapport, sur la même période.
  await page.getByRole("link", { name: /Casse/ }).first().click()
  await expect(
    page.getByRole("heading", { name: "Rapports", level: 1 })
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Par motif" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "2 pièces" })).toBeVisible()
  await shot(page, testInfo, "02-casse")

  await page.getByRole("link", { name: "Écarts" }).click()
  await expect(
    page.getByRole("link", { name: `REC-${year}-0001` })
  ).toBeVisible()
  await expect(page.getByText("1 sur 1 réception")).toBeVisible()
  await shot(page, testInfo, "03-ecarts")

  await page.getByRole("link", { name: "Mouvements" }).click()
  await expect(page.getByRole("heading", { name: "Par article" })).toBeVisible()
  await expect(
    page.getByText("2 articles ont bougé", { exact: false })
  ).toBeVisible()
  await shot(page, testInfo, "04-mouvements")
  const report = page.waitForEvent("download")
  await page.getByRole("button", { name: "Exporter" }).click()
  expect((await report).suggestedFilename()).toMatch(/^mouvements-.*\.xlsx$/)

  // Le stock s'exporte aussi, avec ses filtres.
  await navigateTo(page, "Stock")
  await dismissTour(page, "Dépôt par dépôt")
  const stock = page.waitForEvent("download")
  await page.getByRole("button", { name: "Exporter" }).click()
  expect((await stock).suggestedFilename()).toMatch(/^stock-.*\.xlsx$/)

  // Magasinier : ses gestes du jour, ce qui s'est fait aujourd'hui.
  const storekeeper = await joinTeam(page, browser, testInfo, "STOREKEEPER", [
    depot,
  ])
  await navigateTo(storekeeper, "Accueil")
  await expect(
    storekeeper.getByRole("navigation", { name: "Vos gestes du jour" })
  ).toBeVisible()
  await expect(
    storekeeper.getByRole("heading", { name: "Aujourd’hui dans vos dépôts" })
  ).toBeVisible()
  await expect(storekeeper.getByText("Vos dépôts : Magasin Akwa")).toBeVisible()
  await expect(
    storekeeper.getByRole("heading", { name: "Activité de vos dépôts" })
  ).toHaveCount(0)
  await shot(storekeeper, testInfo, "05-accueil-magasinier")
})
