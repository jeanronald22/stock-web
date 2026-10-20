import { expect, test } from "@playwright/test"

import { waitForMail } from "./mailbox"
import {
  callApi,
  dismissTour,
  navigateTo,
  redirectApi,
  shot,
  signUpWithBusiness,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

const DAY_MS = 86_400_000

/** Jour AAAA-MM-JJ dans [days] jours (négatif : passé). */
const dayIn = (days: number) =>
  new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10)

/**
 * Alertes du gérant (D44). La veille de l'API de test passe toutes les quelques secondes
 * (APP_ALERTS_WATCH_INTERVAL) : les avis arrivent sans attendre l'heure.
 */
test("alertes du gérant : réglage, stock maximum, date limite, avis et e-mail", async ({
  page,
}, testInfo) => {
  test.slow()
  const ownerEmail = await signUpWithBusiness(page, testInfo, "veille")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
  })
  const paint = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: paint,
    name: "Peinture façade 20 L",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: depot, minQuantity: 2, maxQuantity: null }],
  })
  await callApi(page, "POST", "/v1/items", {
    id: crypto.randomUUID(),
    name: "Colle carrelage 25 kg",
    baseUnit: "PIECE",
    batchTracking: true,
    warehouses: [{ warehouseId: depot, minQuantity: null, maxQuantity: null }],
  })
  // Arrivée il y a quatre mois, jamais sortie : du stock qui dort.
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    occurredAt: new Date(Date.now() - 120 * DAY_MS).toISOString(),
    lines: [{ itemId: paint, quantity: 30 }],
  })

  // Le gérant règle ses alertes depuis le tableau de bord : le stock qui dort à 60 jours, sans casse.
  await navigateTo(page, "Tableau de bord")
  await page.getByRole("button", { name: "Régler les alertes" }).click()
  const sheet = page.getByRole("dialog", { name: "Alertes du gérant" })
  await expect(
    sheet.getByRole("textbox", { name: "Rupture prévue" })
  ).toHaveValue("15")
  await sheet.getByRole("textbox", { name: "Stock qui dort" }).fill("60")
  await sheet.getByRole("switch", { name: "Casse anormale" }).click()
  await expect(
    sheet.getByRole("textbox", { name: "Casse anormale" })
  ).toBeHidden()
  await sheet.getByRole("textbox", { name: "Lots qui périment" }).fill("0")
  await sheet.getByRole("button", { name: "Enregistrer" }).click()
  await expect(
    sheet.getByText("Un nombre entier entre 1 et 365.")
  ).toBeVisible()
  await sheet.getByRole("textbox", { name: "Lots qui périment" }).fill("45")
  await shot(page, testInfo, "01-reglage-alertes")
  await sheet.getByRole("button", { name: "Enregistrer" }).click()
  await expect(page.getByText(/^Alertes enregistrées/)).toBeVisible()
  await page.getByRole("button", { name: "Régler les alertes" }).click()
  await expect(
    sheet.getByRole("textbox", { name: "Stock qui dort" })
  ).toHaveValue("60")
  await expect(
    sheet.getByRole("switch", { name: "Casse anormale" })
  ).not.toBeChecked()
  await page.keyboard.press("Escape")

  // Stock maximum sur la fiche : au-dessus du seuil, sinon refusé ; 30 en stock pour 20 : surstock.
  await navigateTo(page, "Articles")
  await dismissTour(page, "Votre catalogue")
  await page.getByRole("link", { name: /Peinture façade/ }).click()
  await page.getByRole("link", { name: "Modifier" }).click()
  await dismissTour(page, "L’unité de comptage")
  await page.getByRole("textbox", { name: "Stock maximum" }).fill("2")
  await page.getByRole("button", { name: "Enregistrer" }).click()
  await expect(
    page.getByText("Le stock maximum doit dépasser le seuil d’alerte.")
  ).toBeVisible()
  await page.getByRole("textbox", { name: "Stock maximum" }).fill("20")
  await shot(page, testInfo, "02-stock-maximum")
  await page.getByRole("button", { name: "Enregistrer" }).click()
  await expect(page.getByText("Article enregistré.")).toBeVisible()
  await expect(page.getByText(/maximum 20 pièces/)).toBeVisible()

  // Réception d'un lot avec sa date limite, dans 10 jours.
  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  await page.getByRole("link", { name: "Nouvelle réception" }).first().click()
  await page
    .getByRole("searchbox", { name: "Rechercher un article à ajouter" })
    .fill("Colle")
  await page.getByRole("button", { name: /^Colle carrelage/ }).click()
  const line = page
    .getByRole("listitem")
    .filter({ hasText: "Colle carrelage 25 kg" })
  await line
    .getByRole("textbox", { name: "Quantité · Colle carrelage 25 kg" })
    .fill("40")
  await line.getByRole("textbox", { name: /^Lot/ }).fill("C2410")
  await line.getByLabel("Périme le · Colle carrelage 25 kg").fill(dayIn(10))
  await shot(page, testInfo, "03-reception-date-limite")
  await page
    .getByRole("button", { name: /Valider la réception · 1 article/ })
    .click()
  await expect(page.getByText(/^Réception REC-.* validée\./)).toBeVisible()

  // La veille passe : un avis par règle, dans l'application et par e-mail.
  const bell = page.getByRole("button", { name: "Notifications, 3 non lues" })
  await expect(async () => {
    await page.reload()
    await expect(bell).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 60_000 })
  await bell.click()
  const panel = page.getByRole("dialog", { name: "Notifications" })
  await expect(panel).toContainText("1 article dort en stock")
  await expect(panel).toContainText(
    "Peinture façade 20 L (Dépôt Bonabéri) : 30 pièces, sans sortie depuis 120 jours"
  )
  await expect(panel).toContainText("1 article en surstock")
  await expect(panel).toContainText("1 lot proche de sa date limite")
  await expect(panel).toContainText(
    /Colle carrelage 25 kg, lot C2410 \(Dépôt Bonabéri\) : périme le/
  )
  await shot(page, testInfo, "04-avis")
  await page.keyboard.press("Escape")
  expect(await waitForMail(ownerEmail, "1 article en surstock")).toContain(
    "Peinture façade 20 L à Dépôt Bonabéri : 30 pièces en stock, maximum 20 pièces"
  )

  // Le lot porte sa date limite dans le stock de l'article.
  await navigateTo(page, "Articles")
  await page.getByRole("link", { name: /Colle carrelage/ }).click()
  await page.getByRole("button", { name: "Détail du stock" }).click()
  await expect(page.getByText(/C2410 · périme le/)).toBeVisible()
  await shot(page, testInfo, "05-lot-date-limite")
})
