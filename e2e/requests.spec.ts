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

test("sortie à valider : préparée par le magasinier, refusée avec motif, refaite, puis validée", async ({
  page,
  browser,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "validation")
  await dismissTour(page, "Tout est ici")
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

  // La règle se règle dans « Paramètres › Règles de travail » (D45).
  await navigateTo(page, "Paramètres")
  await page.getByRole("link", { name: "Règles de travail" }).click()
  await page
    .getByRole("switch", {
      name: "Les sorties des magasiniers passent par une validation",
    })
    .click()
  await expect(
    page.getByText("Les sorties des magasiniers seront validées.")
  ).toBeVisible()
  await shot(page, testInfo, "01-regle")

  // Le magasinier prépare : le bouton dit ce qui va se passer.
  const storekeeper = await joinTeam(page, browser, testInfo, "STOREKEEPER", [
    depot,
  ])
  await navigateTo(storekeeper, "Bons")
  await dismissTour(storekeeper, "Entrées et sorties")
  await storekeeper
    .getByRole("link", { name: "Nouvelle sortie" })
    .first()
    .click()
  await expect(
    storekeeper.getByText(/Un responsable du dépôt valide cette sortie/)
  ).toBeVisible()
  await storekeeper
    .getByRole("searchbox", { name: "Rechercher un article à ajouter" })
    .fill("Carreau")
  await storekeeper.getByRole("button", { name: /Carreau 60x60/ }).click()
  await storekeeper
    .getByRole("textbox", { name: "Quantité · Carreau 60x60" })
    .fill("30")
  await shot(storekeeper, testInfo, "02-sortie-a-valider")
  await storekeeper
    .getByRole("button", { name: "Envoyer pour validation · 1 article" })
    .click()
  await expect(storekeeper.getByText("Demande envoyée")).toBeVisible()

  // Le responsable la voit sur le tableau de bord, la refuse avec un motif.
  await navigateTo(page, "Tableau de bord")
  await page.getByRole("link", { name: "1 sortie à valider" }).click()
  await page.getByRole("link", { name: "Sans client" }).click()
  await expect(
    page.getByText(/Cette sortie attend votre décision/)
  ).toBeVisible()
  await expect(page.getByText("En stock : 100 pièces")).toBeVisible()
  await shot(page, testInfo, "03-demande")
  await page.getByRole("button", { name: "Refuser" }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Refuser" })
    .click()
  await expect(
    page.getByText("Expliquez en quelques mots pourquoi.")
  ).toBeVisible()
  await page.getByLabel("Motif").fill("Trop pour ce chantier : 20 au plus")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Refuser" })
    .click()
  await expect(page.getByText("Demande refusée.")).toBeVisible()

  // Le magasinier lit le motif et refait la demande, lignes reprises.
  await navigateTo(storekeeper, "Bons")
  await storekeeper.getByRole("link", { name: /À valider/ }).click()
  await storekeeper.getByRole("button", { name: "Refusées" }).click()
  await storekeeper.getByRole("link", { name: "Sans client" }).click()
  await expect(
    storekeeper.getByText("« Trop pour ce chantier : 20 au plus »")
  ).toBeVisible()
  await storekeeper.getByRole("link", { name: "Refaire la demande" }).click()
  const quantity = storekeeper.getByRole("textbox", {
    name: "Quantité · Carreau 60x60",
  })
  await expect(quantity).toHaveValue("30")
  await quantity.fill("20")
  await storekeeper
    .getByRole("button", { name: "Envoyer pour validation · 1 article" })
    .click()
  await expect(storekeeper.getByText(/En attente de validation/)).toBeVisible()

  // Validée : un bon à deux signatures, le stock part à ce moment-là.
  await navigateTo(page, "Bons")
  await page.getByRole("link", { name: /À valider/ }).click()
  await page.getByRole("link", { name: "Sans client" }).click()
  await page.getByRole("button", { name: "Valider la sortie" }).click()
  await expect(
    page.getByText(`Sortie validée : bon SOR-${year}-0001.`)
  ).toBeVisible()
  await page.getByRole("link", { name: `SOR-${year}-0001` }).click()
  await expect(page.getByText("Préparé par")).toBeVisible()
  await expect(page.getByText("Paul Etoga")).toBeVisible()
  await expect(page.getByText("− 20 pièces")).toBeVisible()
  await shot(page, testInfo, "04-bon-deux-signatures")
})
