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
/** Une liste relue après la création s'affiche aussitôt ; avant (audit, bug 5), il fallait 2 à 7 s. */
const LIST_SHOWN_MS = 1_500
/** Le message d'une validation s'effaçait en 3 à 4 s (audit, bug 9). */
const TOAST_GONE_MS = 6_000

/** Rien ne dépasse de l'écran : pas de défilement horizontal (audit, bug 7). */
async function expectNoHorizontalScroll(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
}

test("après l'audit de recette : en-tête, liste après création, rappel et confirmation d'un bon", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "audit")
  await dismissTour(page, "Tout est ici")

  // Espace vide : il est créé, pas « tout en place » ; les rapports sont à portée (bugs 15, 16).
  await expect(
    page.getByRole("heading", { name: "Votre espace est créé" })
  ).toBeVisible()
  // En tête du tableau de bord ; la carte des bons y mène aussi.
  await expect(
    page.getByRole("link", { name: "Rapports" }).first()
  ).toBeVisible()
  // Téléphone compris, l'en-tête tient dans l'écran (bug 7a).
  await expect(page.getByRole("button", { name: "Guide" })).toBeInViewport()
  await expect(
    page.getByRole("button", { name: "Notifications" })
  ).toBeInViewport()
  await expectNoHorizontalScroll(page)
  await shot(page, testInfo, "01-accueil-vide")

  // Un dépôt créé est dans la liste dès le retour, sans « Déclarez votre premier dépôt » (bug 5).
  await navigateTo(page, "Dépôts")
  await dismissTour(page, "Vos lieux de stock")
  await page.getByRole("link", { name: "Nouveau dépôt" }).first().click()
  await page.getByRole("radio", { name: /Dépôt/ }).click()
  await page.getByRole("button", { name: "Continuer" }).click()
  await page.getByLabel("Nom", { exact: true }).fill("Dépôt Bonabéri")
  await page.getByLabel(/Ville/).fill("Douala")
  await page.getByRole("button", { name: "Créer le dépôt" }).click()
  await expect(page.getByRole("link", { name: /Dépôt Bonabéri/ })).toBeVisible({
    timeout: LIST_SHOWN_MS,
  })
  await expect(
    page.getByRole("heading", { name: "Déclarez votre premier dépôt" })
  ).toBeHidden()

  const [warehouse] = await callApi<{ id: string }[]>(
    page,
    "GET",
    "/v1/warehouses"
  )
  await callApi(page, "POST", "/v1/items", {
    id: crypto.randomUUID(),
    name: "Fer à béton HA10",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: warehouse.id, minQuantity: null }],
  })

  // Réception comparée au bon de livraison : l'écart se confirme avant validation (bug 19).
  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  await page.getByRole("link", { name: "Nouvelle réception" }).first().click()
  await page
    .getByRole("switch", { name: "Comparer au bon de livraison" })
    .click()
  await page
    .getByRole("searchbox", { name: "Rechercher un article à ajouter" })
    .fill("Fer")
  await page.getByRole("button", { name: /Fer à béton HA10/ }).click()
  await page
    .getByRole("textbox", { name: "Quantité · Fer à béton HA10" })
    .fill("98")
  await page
    .getByRole("textbox", { name: "Annoncé (BL) · Fer à béton HA10" })
    .fill("100")
  await page
    .getByRole("button", { name: "Valider la réception · 1 article" })
    .click()
  const review = page.getByRole("alertdialog")
  await expect(
    review.getByRole("heading", { name: "Vérifier avant de valider" })
  ).toBeVisible()
  await expect(
    review.getByText("Fer à béton HA10 : reçu 98 pièces, annoncé 100 pièces")
  ).toBeVisible()
  await shot(page, testInfo, "02-confirmation-ecart")
  await review.getByRole("button", { name: "Valider quand même" }).click()

  // Le bon reste accessible après validation, bien après qu'un message se serait effacé (bug 9).
  const recorded = page
    .getByRole("status")
    .filter({ hasText: `Réception REC-${year}-0001 validée.` })
  await expect(recorded).toBeVisible()
  await page.waitForTimeout(TOAST_GONE_MS)
  await expect(recorded).toBeVisible()
  await expectNoHorizontalScroll(page)
  await shot(page, testInfo, "03-rappel-du-bon")
  await recorded.getByRole("link", { name: "Voir le bon" }).click()
  await expect(
    page.getByRole("heading", { name: `REC-${year}-0001` })
  ).toBeVisible()

  // Liste des bons : rien ne dépasse, ni sur téléphone ni sur ordinateur (bug 7b).
  await navigateTo(page, "Bons")
  await expect(
    page.getByRole("link", { name: `REC-${year}-0001` })
  ).toBeVisible()
  await expectNoHorizontalScroll(page)
})
