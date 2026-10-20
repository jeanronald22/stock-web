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

test("tableau de bord par rôle, ses filtres et ses rapports (mouvements, casse, écarts), exports Excel", async ({
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

  // Gérant : le tableau de bord, ce qui attend d'abord, puis l'activité des 30 derniers jours.
  // Bons créés par l'API : le tableau déjà ouvert est rechargé, comme en y revenant.
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Tableau de bord", level: 1 })
  ).toBeVisible()
  const alerts = page.getByRole("navigation", { name: "À traiter" })
  await expect(
    alerts.getByRole("link", { name: "1 article à commander" })
  ).toBeVisible()
  await expect(
    alerts.getByRole("link", { name: "1 réception avec écart" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Entrées et sorties" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "État du stock" })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: /À commander\s*1\s*50 %/ })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Les plus sortis" })
  ).toBeVisible()
  await expect(page.getByText("0 conforme sur 1 réception")).toBeVisible()
  await expect(page.getByRole("heading", { name: "L’équipe" })).toBeVisible()
  await expect(page.getByText("3 bons", { exact: true })).toBeVisible()
  await shot(page, testInfo, "01-tableau-de-bord-gerant")

  // Sur 7 jours, 30 carreaux sortis : les 68 restants tiennent 15 jours.
  await page.getByRole("button", { name: /^Période/ }).click()
  await page.getByRole("button", { name: "7 derniers jours" }).click()
  await expect(
    page.getByText("4,3 pièces par jour · 68 pièces en stock")
  ).toBeVisible()
  await expect(page.getByText("≈ 15 jours")).toBeVisible()

  // Un domaine choisi : ses seules cartes, gardées dans l'adresse.
  await page.getByRole("button", { name: "Qualité", exact: true }).click()
  await expect(page).toHaveURL(/domaine=qualite/)
  await expect(
    page.getByRole("heading", { name: "Conformité des réceptions" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "État du stock" })
  ).toHaveCount(0)
  await shot(page, testInfo, "02-domaine-qualite")
  await page.getByRole("button", { name: "Tout", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "État du stock" })
  ).toBeVisible()

  // Un article : sa fiche en tête ; les classements d'articles disparaissent.
  await page.getByRole("button", { name: "Filtrer par article" }).click()
  await page.getByPlaceholder("Nom, référence ou code-barres").fill("Ciment")
  await page.getByRole("option", { name: /Ciment 50 kg/ }).click()
  await expect(page).toHaveURL(/article=/)
  await expect(
    page.getByRole("heading", { name: "Ciment 50 kg", level: 2 })
  ).toBeVisible()
  await expect(page.getByText("40 pièces").first()).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Les plus sortis" })
  ).toHaveCount(0)
  await shot(page, testInfo, "03-tableau-article")
  // Les rapports reprennent l'article et la période.
  await page.getByRole("link", { name: "Rapports" }).click()
  await expect(page).toHaveURL(/\/rapports\?.*article=/)
  await expect(
    page.getByText("1 article a bougé", { exact: false })
  ).toBeVisible()
  await page.getByRole("button", { name: "Retirer le filtre article" }).click()
  await expect(
    page.getByText("2 articles ont bougé", { exact: false })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Rapports", level: 1 })
  ).toBeVisible()
  await shot(page, testInfo, "04-mouvements")
  const report = page.waitForEvent("download")
  await page.getByRole("button", { name: "Exporter" }).click()
  expect((await report).suggestedFilename()).toMatch(/^mouvements-.*\.xlsx$/)

  await page.getByRole("link", { name: "Casse" }).click()
  await expect(page).toHaveURL(/\/rapports\/casse\?/)
  await expect(page.getByRole("heading", { name: "Par motif" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "2 pièces" })).toBeVisible()
  await shot(page, testInfo, "05-casse")

  await page.getByRole("link", { name: "Écarts" }).click()
  await expect(
    page.getByRole("link", { name: `REC-${year}-0001` })
  ).toBeVisible()
  await expect(page.getByText("1 sur 1 réception")).toBeVisible()
  await shot(page, testInfo, "06-ecarts")

  // Le fil d'Ariane ramène au tableau de bord.
  await page
    .getByRole("navigation", { name: "Fil d’Ariane" })
    .getByRole("link", { name: "Tableau de bord" })
    .click()
  await expect(
    page.getByRole("heading", { name: "Tableau de bord", level: 1 })
  ).toBeVisible()

  // Le stock s'exporte aussi, avec ses filtres ; les rapports n'y sont plus.
  await navigateTo(page, "Stock")
  await dismissTour(page, "Dépôt par dépôt")
  const stock = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Plus d’actions sur le stock" })
    .click()
  await expect(page.getByRole("menuitem", { name: "Rapports" })).toHaveCount(0)
  await page.getByRole("menuitem", { name: "Exporter" }).click()
  expect((await stock).suggestedFilename()).toMatch(/^stock-.*\.xlsx$/)

  // Magasinier : ses gestes du jour, ce qui s'est fait aujourd'hui ; pas le tableau du gérant.
  const storekeeper = await joinTeam(page, browser, testInfo, "STOREKEEPER", [
    depot,
  ])
  await navigateTo(storekeeper, "Tableau de bord")
  await expect(
    storekeeper.getByRole("navigation", { name: "Vos gestes du jour" })
  ).toBeVisible()
  await expect(
    storekeeper.getByRole("heading", { name: "Aujourd’hui dans vos dépôts" })
  ).toBeVisible()
  await expect(storekeeper.getByText("Vos dépôts : Magasin Akwa")).toBeVisible()
  await expect(
    storekeeper.getByRole("group", { name: "Domaines affichés" })
  ).toHaveCount(0)
  await shot(storekeeper, testInfo, "07-accueil-magasinier")
})
