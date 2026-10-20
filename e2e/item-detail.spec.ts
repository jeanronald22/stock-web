import path from "node:path"

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
const PHOTO = path.join(import.meta.dirname, "fixtures", "carreau.png")

test("fiche article : le stock en grand, par dépôt, ses mouvements ; modifier est un écran à part", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await signUpWithBusiness(page, testInfo, "fiche-article")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
  })
  // Second dépôt, sans stock ni seuil : le graphique compare les dépôts.
  const akwa = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: akwa,
    name: "Magasin Akwa",
    kind: "SHOP",
  })
  const tile = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tile,
    name: "Carreau 60x60",
    baseUnit: "PIECE",
    barcode: "6181234567890",
    packagings: [{ name: "Carton", quantity: 4 }],
    warehouses: [
      { warehouseId: depot, minQuantity: 120 },
      { warehouseId: akwa },
    ],
  })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    lines: [{ itemId: tile, quantity: 102 }],
  })

  await navigateTo(page, "Articles")
  await page.getByRole("link", { name: /Carreau 60x60/ }).click()
  await expect(
    page.getByRole("heading", { name: "Carreau 60x60", level: 1 })
  ).toBeVisible()
  // Référence numérotée à la création (D41), pas tirée du nom.
  await expect(
    page.getByRole("button", { name: "Copier : Référence" })
  ).toBeVisible()
  await expect(
    page.getByText("ART-0001", { exact: true }).first()
  ).toBeVisible()
  // En tête, l'essentiel ; dessous, la fiche technique et le stock de chaque dépôt.
  const summary = page.getByLabel("L’essentiel de l’article")
  await expect(summary.getByText("102 pièces")).toBeVisible()
  await expect(summary.getByText("soit 25 × Carton + 2 pièces")).toBeVisible()
  await expect(summary.getByText("Stock bas")).toBeVisible()
  await expect(page.getByText("Seuil d’alerte : 120 pièces")).toBeVisible()
  await expect(page.getByText("6181234567890")).toBeVisible()
  await page.getByRole("button", { name: "Copier : Code-barres" }).click()
  await expect(
    page.getByRole("button", { name: "Code-barres copié" })
  ).toBeVisible()
  await shot(page, testInfo, "01-fiche")
  await page.getByRole("tab", { name: "Stock par dépôt" }).click()
  await expect(
    page.getByRole("img", { name: "Stock et seuil d’alerte de chaque dépôt" })
  ).toBeVisible()
  // Les barres de Recharts s'animent en JavaScript, hors de getAnimations().
  await page.waitForTimeout(1500)
  await page
    .getByRole("region", { name: "Par dépôt" })
    .screenshot({ path: testInfo.outputPath("01a-stock.png") })
  await page.getByRole("tab", { name: "Mouvements" }).click()
  await expect(
    page.getByRole("img", {
      name: "Sur la période : 102 pièces entrés, 0 pièce sortis.",
    })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: new RegExp(`REC-${year}-0001`) })
  ).toBeVisible()
  // La période se choisit au calendrier, comme dans les rapports.
  await page
    .getByRole("button", { name: "Période de la courbe : 30 derniers jours" })
    .click()
  await page.getByRole("button", { name: "7 derniers jours" }).click()
  await expect(
    page.getByRole("button", {
      name: "Période de la courbe : 7 derniers jours",
    })
  ).toBeVisible()
  await expect(
    page.getByRole("img", {
      name: "Sur la période : 102 pièces entrés, 0 pièce sortis.",
    })
  ).toBeVisible()
  await page.waitForTimeout(1500)
  await page
    .getByRole("tabpanel")
    .screenshot({ path: testInfo.outputPath("01b-mouvements.png") })

  // Une sortie part avec l'article déjà sur le bon.
  await page.getByRole("button", { name: "Autres actions" }).click()
  await page
    .getByRole("menuitem", { name: "Nouvelle sortie de cet article" })
    .click()
  await page.getByRole("combobox", { name: "Dépôt" }).click()
  await page.getByRole("option", { name: "Dépôt Bonabéri" }).click()
  await expect(
    page.getByRole("textbox", { name: "Quantité · Carreau 60x60" })
  ).toBeVisible()
  await page
    .getByRole("textbox", { name: "Quantité · Carreau 60x60" })
    .fill("2")
  await page
    .getByRole("button", { name: "Valider la sortie · 1 article" })
    .click()
  await expect(page.getByText(`Sortie SOR-${year}-0001 validée.`)).toBeVisible()

  // Modifier : écran à part, retour à la fiche après l'enregistrement.
  await page.goto(`/articles/${tile}?onglet=mouvements`)
  await expect(summary.getByText("soit 25 × Carton")).toBeVisible()
  await expect(page.getByText("− 2 pièces")).toBeVisible()
  await page.getByRole("link", { name: "Modifier" }).click()
  await dismissTour(page, "L’unité de comptage")
  await expect(
    page.getByRole("heading", { name: "Modifier l’article" })
  ).toBeVisible()
  await page.locator("#name").fill("Carreau 60x60 gris")
  await page.getByRole("button", { name: "Enregistrer" }).click()
  await expect(page.getByText("Article enregistré.")).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Carreau 60x60 gris", level: 1 })
  ).toBeVisible()
  await shot(page, testInfo, "02-fiche-apres-modification")

  // Partout ailleurs, survoler le nom d'un article montre son aperçu (souris seulement).
  if (testInfo.project.name !== "desktop") return
  await page.goto("/stock?vue=liste")
  await dismissTour(page, "Dépôt par dépôt")
  await page.getByRole("link", { name: "Carreau 60x60 gris" }).hover()
  const preview = page.getByRole("link", { name: "Ouvrir la fiche" })
  await expect(preview).toBeVisible()
  await expect(page.getByText("6181234567890")).toBeVisible()
  await shot(page, testInfo, "03-apercu")
  await preview.click()
  await expect(
    page.getByRole("heading", { name: "Carreau 60x60 gris", level: 1 })
  ).toBeVisible()
})

test("photos d'un article : ajoutées depuis la fiche, cinq au plus, la principale au choix", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "photos-article")
  await dismissTour(page, "Tout est ici")
  const tile = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tile,
    name: "Carreau 30x30",
    baseUnit: "PIECE",
  })
  await page.goto(`/articles/${tile}`)
  const photos = page.getByRole("region", { name: "Photos" })
  await expect(photos.getByText("0 sur 5")).toBeVisible()

  // Sans photo, l'en-tête invite à en ajouter une, sans ouvrir le formulaire.
  await page.getByLabel("Ajouter des photos").first().setInputFiles(PHOTO)
  await expect(page.getByText("Photo ajoutée.")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Agrandir la photo de Carreau 30x30" })
  ).toBeVisible()
  await expect(photos.getByText("1 sur 5")).toBeVisible()

  // Plusieurs d'un coup : au-delà de cinq, seules les premières sont ajoutées.
  await photos.getByLabel("Ajouter des photos").setInputFiles([PHOTO, PHOTO])
  await expect(page.getByText("2 photos ajoutées.")).toBeVisible()
  await photos
    .getByLabel("Ajouter des photos")
    .setInputFiles([PHOTO, PHOTO, PHOTO, PHOTO])
  await expect(
    page.getByText("5 photos au plus par article : seules les 2 premières")
  ).toBeVisible()
  await expect(photos.getByText("5 sur 5")).toBeVisible()
  await expect(photos.getByLabel("Ajouter des photos")).toHaveCount(0)
  await shot(page, testInfo, "01-photos")

  // En grand : on passe d'une photo à l'autre, on choisit la principale, on en supprime une.
  await photos.getByRole("button", { name: "Voir la photo 3 sur 5" }).click()
  const viewer = page.getByRole("dialog", { name: "Carreau 30x30" })
  await expect(viewer.getByText("3 / 5")).toBeVisible()
  await viewer.getByRole("button", { name: "Photo suivante" }).click()
  await expect(viewer.getByText("4 / 5")).toBeVisible()
  await shot(page, testInfo, "02-visionneuse")
  await viewer.getByRole("button", { name: "Définir comme principale" }).click()
  await expect(page.getByText("Photo principale changée.")).toBeVisible()
  await expect(viewer.getByText("1 / 5")).toBeVisible()
  await expect(viewer.getByText("Principale")).toBeVisible()
  await viewer.getByRole("button", { name: "Supprimer" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Supprimer" })
    .click()
  await expect(page.getByText("Photo supprimée.")).toBeVisible()
  await expect(viewer.getByText("1 / 4")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(photos.getByText("4 sur 5")).toBeVisible()
  await expect(photos.getByLabel("Ajouter des photos")).toHaveCount(1)
})
