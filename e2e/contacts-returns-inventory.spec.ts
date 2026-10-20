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

/** Un dépôt (choisi d'office : il est seul), 100 carreaux et 40 sacs de ciment. */
async function stockedDepot(page: Page) {
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
  })
  const tile = crypto.randomUUID()
  const cement = crypto.randomUUID()
  for (const [id, name] of [
    [tile, "Carreau 60x60"],
    [cement, "Ciment 50 kg"],
  ])
    await callApi(page, "POST", "/v1/items", {
      id,
      name,
      baseUnit: "PIECE",
      warehouses: [{ warehouseId: depot, minQuantity: null }],
    })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    lines: [
      { itemId: tile, quantity: 100 },
      { itemId: cement, quantity: 40 },
    ],
  })
}

test("un chantier se crée dans Contacts, reçoit une sortie, puis rapporte une partie", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "chantier")
  await dismissTour(page, "Tout est ici")
  await stockedDepot(page)

  // Contacts : second onglet, création rapide d'un chantier.
  await navigateTo(page, "Contacts")
  await dismissTour(page, "Vos fournisseurs")
  await page.getByRole("link", { name: "Clients et chantiers" }).click()
  await page.getByRole("button", { name: "Nouveau client" }).first().click()
  await page.getByRole("radio", { name: /Chantier/ }).click()
  await page.getByLabel("Nom").fill("Chantier Koné")
  await page.getByLabel(/Téléphone/).fill("+237 6 99 00 11 22")
  await shot(page, testInfo, "01-nouveau-chantier")
  await page.getByRole("button", { name: "Ajouter", exact: true }).click()
  await expect(page.getByRole("link", { name: "Chantier Koné" })).toBeVisible()

  // Sortie vers ce chantier, choisi dans l'annuaire.
  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  await page.getByRole("link", { name: "Nouvelle sortie" }).first().click()
  await page.getByRole("searchbox", { name: "Client ou chantier" }).fill("Koné")
  await page.getByRole("button", { name: "Chantier Koné" }).click()
  await page
    .getByRole("searchbox", { name: "Rechercher un article à ajouter" })
    .fill("Carreau")
  await page.getByRole("button", { name: /Carreau 60x60/ }).click()
  await page
    .getByRole("textbox", { name: "Quantité · Carreau 60x60" })
    .fill("10")
  await page
    .getByRole("button", { name: "Valider la sortie · 1 article" })
    .click()
  await expect(page.getByText(`Sortie SOR-${year}-0001 validée.`)).toBeVisible()

  // Retour depuis la sortie : la ligne est proposée avec ce qui reste.
  await page.getByRole("button", { name: "Voir le bon" }).click()
  await page.getByRole("button", { name: /^Actions du bon SOR-/ }).click()
  await page.getByRole("menuitem", { name: "Enregistrer un retour" }).click()
  await expect(
    page
      .getByText("Retour du bon")
      .getByRole("link", { name: `SOR-${year}-0001` })
  ).toBeVisible()
  await expect(page.getByText("Reste à retourner : 10 pièces")).toBeVisible()
  const quantity = page.getByRole("textbox", {
    name: "Quantité · Carreau 60x60",
  })
  await quantity.fill("12")
  await page
    .getByRole("button", { name: "Valider le retour · 1 article" })
    .click()
  await expect(
    page.getByText("Au plus ce qui reste à retourner.")
  ).toBeVisible()
  await quantity.fill("4")
  await shot(page, testInfo, "02-retour-client")
  await page
    .getByRole("button", { name: "Valider le retour · 1 article" })
    .click()
  await expect(
    page.getByRole("heading", { name: `RCL-${year}-0001` })
  ).toBeVisible()
  await expect(page.getByText("+ 4 pièces")).toBeVisible()
  await expect(page.getByRole("link", { name: "Chantier Koné" })).toBeVisible()

  // La fiche du chantier retrouve la sortie et le retour.
  await page.getByRole("link", { name: "Chantier Koné" }).click()
  await expect(
    page.getByRole("link", { name: new RegExp(`SOR-${year}-0001`) })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: new RegExp(`RCL-${year}-0001`) })
  ).toBeVisible()
  await shot(page, testInfo, "03-fiche-chantier")
})

test("inventaire : comptage à l'aveugle, écart, second comptage, clôture par un ajustement", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "inventaire")
  await dismissTour(page, "Tout est ici")
  await stockedDepot(page)

  await navigateTo(page, "Stock")
  await dismissTour(page, "Dépôt par dépôt")
  await page
    .getByRole("button", { name: "Plus d’actions sur le stock" })
    .click()
  await page.getByRole("menuitem", { name: "Faire un inventaire" }).click()
  await page
    .getByRole("button", { name: "Ouvrir la feuille de comptage" })
    .click()
  await expect(
    page.getByRole("heading", { name: "Inventaire · Dépôt Bonabéri" })
  ).toBeVisible()
  await expect(page.getByText("0 sur 2 comptés").first()).toBeVisible()
  // À l'aveugle : rien n'indique le stock avant le comptage.
  await expect(page.getByText(/théorique/)).toHaveCount(0)

  await page
    .getByRole("textbox", { name: "Quantité comptée · Carreau 60x60" })
    .fill("98")
  await page.keyboard.press("Enter")
  await page
    .getByRole("textbox", { name: "Quantité comptée · Ciment 50 kg" })
    .fill("40")
  await page.keyboard.press("Enter")
  await expect(page.getByText("Tout est compté.")).toBeVisible()

  await page.getByRole("tab", { name: "Écarts" }).click()
  await expect(page.getByText("Écart −2 pièces")).toBeVisible()
  await expect(page.getByText("(théorique 100 pièces)")).toBeVisible()
  await page.getByRole("button", { name: "Recompter" }).click()
  await page
    .getByRole("textbox", { name: "Second comptage · Carreau 60x60" })
    .fill("97")
  await page.keyboard.press("Enter")
  await expect(page.getByText("Écart −3 pièces")).toBeVisible()
  await shot(page, testInfo, "01-inventaire-ecart")

  await page.getByRole("button", { name: "Clôturer" }).click()
  await expect(
    page.getByText("1 écart sera inscrit au stock par un bon d’ajustement.")
  ).toBeVisible()
  await page.getByRole("button", { name: "Clôturer" }).last().click()
  await expect(
    page.getByText(`Inventaire clôturé : bon AJU-${year}-0001.`)
  ).toBeVisible()
  await expect(page.getByText("Clôturé", { exact: true })).toBeVisible()
  await shot(page, testInfo, "02-inventaire-clos")

  await page.getByRole("link", { name: `AJU-${year}-0001` }).click()
  await expect(page.getByText("Inventaire", { exact: true })).toBeVisible()
  await expect(page.getByText("− 3 pièces")).toBeVisible()
  await expect(
    page.getByRole("link", { name: "voir l’inventaire" })
  ).toBeVisible()
})
