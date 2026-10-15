import { expect, test } from "@playwright/test"

import {
  callApi,
  dismissTour,
  redirectApi,
  shot,
  signUpWithBusiness,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

const year = new Date().getFullYear()

test("hors ligne : la sortie est gardée sur le téléphone, envoyée au retour du réseau ; un refus se reprend", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await signUpWithBusiness(page, testInfo, "hors-ligne")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Magasin Akwa",
    kind: "SHOP",
  })
  const tile = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tile,
    name: "Carreau 60x60",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: depot }],
  })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    lines: [{ itemId: tile, quantity: 100 }],
  })
  const quantity = page.getByRole("textbox", {
    name: "Quantité · Carreau 60x60",
  })
  const validate = page.getByRole("button", {
    name: "Valider la sortie · 1 article",
  })

  // Le réseau tombe pendant la saisie : la sortie reste sur le téléphone.
  await page.goto(`/bons/sortie?article=${tile}`)
  await expect(quantity).toBeVisible()
  await context.setOffline(true)
  await quantity.fill("12")
  await validate.click()
  await expect(page.getByText("Bon gardé sur ce téléphone")).toBeVisible()
  await expect(
    page.getByRole("status", { name: "Hors ligne · 1 à envoyer" })
  ).toBeVisible()
  await shot(page, testInfo, "01-garde-hors-ligne")

  // Le réseau revient : la sortie part toute seule.
  await context.setOffline(false)
  await expect(page.getByText(`Bon SOR-${year}-0001 envoyé.`)).toBeVisible()
  await expect(page.getByRole("status", { name: /à envoyer/ })).toHaveCount(0)

  // Une seconde sortie, impossible (plus que le stock) : elle partira aussi, et sera refusée.
  await page.goto(`/bons/sortie?article=${tile}`)
  await expect(quantity).toBeVisible()
  await context.setOffline(true)
  await quantity.fill("500")
  await validate.click()
  await expect(page.getByText("Bon gardé sur ce téléphone")).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByRole("status", { name: "1 à corriger" })).toBeVisible()

  // Dans « Bons », le motif ; « Reprendre » rouvre la saisie telle quelle.
  await page.getByRole("status", { name: "1 à corriger" }).click()
  await dismissTour(page, "Entrées et sorties")
  await expect(
    page.getByRole("heading", { name: "1 saisie sur ce téléphone" })
  ).toBeVisible()
  await expect(page.getByText(/pas assez de stock/)).toBeVisible()
  await shot(page, testInfo, "02-a-corriger")
  await page.getByRole("link", { name: "Reprendre" }).click()
  await expect(quantity).toHaveValue("500")
  await quantity.fill("50")
  await validate.click()
  await expect(
    page.getByRole("heading", { name: "1 saisie sur ce téléphone" })
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: new RegExp(`SOR-${year}-0002`) })
  ).toBeVisible()
})
