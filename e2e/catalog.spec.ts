import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

import {
  dismissTour,
  navigateTo,
  redirectApi,
  shot,
  signUpWithBusiness,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

const PHOTO = path.join(import.meta.dirname, "fixtures", "carreau.png")

const next = (page: Page) =>
  page.getByRole("button", { name: "Continuer" }).click()

/** Assistant de création d'un dépôt : le type de lieu, puis le nom. */
async function createWarehouse(page: Page, name: string, kind: string) {
  await page.getByRole("link", { name: "Nouveau dépôt" }).first().click()
  await expect(
    page.getByRole("heading", { name: "Quel type de lieu ?" })
  ).toBeVisible()
  await page.getByRole("radio", { name: new RegExp(kind) }).click()
  await next(page)
  await expect(
    page.getByRole("heading", { name: "Comment s’appelle-t-il ?" })
  ).toBeVisible()
  await page.getByLabel("Nom", { exact: true }).fill(name)
  await page.getByLabel(/Ville/).fill("Douala")
  await page.getByRole("button", { name: "Créer le dépôt" }).click()
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible()
}

test("articles et dépôts : un article proposé dans un dépôt et pas dans l'autre", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "catalogue")
  await dismissTour(page, "Tout est ici")

  await navigateTo(page, "Dépôts")
  await expect(
    page.getByRole("heading", { name: "Déclarez votre premier dépôt" })
  ).toBeVisible()
  await dismissTour(page, "Vos lieux de stock")
  await shot(page, testInfo, "01-depots-vide")
  await createWarehouse(page, "Dépôt Bonabéri", "Dépôt")
  await createWarehouse(page, "Boutique Akwa", "Boutique")
  await shot(page, testInfo, "02-depots")

  await navigateTo(page, "Articles")
  await expect(
    page.getByRole("heading", { name: "Créez votre premier article" })
  ).toBeVisible()
  await dismissTour(page, "Votre catalogue")

  // Carreau : compté au m², vendu par carton de 1,44 m², proposé au seul dépôt de Bonabéri.
  await page.getByRole("link", { name: "Nouvel article" }).click()
  await expect(
    page.getByRole("heading", { name: "Quel article ajoutez-vous ?" })
  ).toBeVisible()
  await page.getByLabel("Nom", { exact: true }).fill("Carreau 60x60 beige")
  await page.getByLabel(/Référence/).fill("CAR-6060")
  await shot(page, testInfo, "03-assistant-article")
  await next(page)
  await expect(
    page.getByRole("heading", { name: "Une photo de l’article ?" })
  ).toBeVisible()
  await page.locator("input[type=file]").setInputFiles(PHOTO)
  await expect(
    page.getByRole("img", { name: "Photo de l’article" })
  ).toBeVisible()
  await shot(page, testInfo, "03b-assistant-photo")
  await next(page)
  await page.getByRole("radio", { name: /Mètre carré/ }).click()
  await next(page)
  await page.getByRole("button", { name: "Ajouter un conditionnement" }).click()
  await page.getByRole("textbox", { name: "Nom" }).fill("Carton")
  await page.getByRole("textbox", { name: "Contient" }).fill("1,44")
  await expect(page.getByText("1 Carton = 1,44 m²")).toBeVisible()
  await shot(page, testInfo, "04-assistant-conditionnement")
  await next(page)
  await expect(
    page.getByRole("heading", { name: "Où le proposez-vous ?" })
  ).toBeVisible()
  await page.getByText("Dépôt Bonabéri").click()
  await page.getByRole("button", { name: "Créer l’article" }).click()
  await expect(
    page.getByRole("link", { name: /Carreau 60x60 beige/ })
  ).toBeVisible()

  // Ciment : compté à la pièce ; 2,5 sacs par palette est refusé dès l'étape des conditionnements.
  await page.getByRole("link", { name: "Nouvel article" }).click()
  await page.getByLabel("Nom", { exact: true }).fill("Ciment CPJ 42,5")
  for (let step = 0; step < 3; step++) await next(page)
  await page.getByRole("button", { name: "Ajouter un conditionnement" }).click()
  await page.getByRole("textbox", { name: "Nom" }).fill("Palette")
  await page.getByRole("textbox", { name: "Contient" }).fill("2,5")
  await next(page)
  await expect(page.getByText("Un nombre entier de pièces.")).toBeVisible()
  await page.getByRole("textbox", { name: "Contient" }).fill("40")
  await next(page)
  await page.getByText("Boutique Akwa").click()
  await page.getByRole("button", { name: "Créer l’article" }).click()
  await expect(
    page.getByRole("link", { name: /Ciment CPJ 42,5/ })
  ).toBeVisible()
  // La photo du carreau s'affiche en vignette, chargée par son lien signé.
  const thumbnail = page
    .getByRole("row", { name: /Carreau 60x60 beige/ })
    .locator("img")
  await expect(thumbnail).toHaveAttribute("src", /\/v1\/files\//)
  await expect
    .poll(() =>
      thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth)
    )
    .toBeGreaterThan(0)
  await shot(page, testInfo, "05-articles")

  // Référence déjà prise : refusée par l'API à la fin, l'assistant revient à la première étape.
  await page.getByRole("link", { name: "Nouvel article" }).click()
  await page.getByLabel("Nom", { exact: true }).fill("Autre carreau")
  await page.getByLabel(/Référence/).fill("car-6060")
  for (let step = 0; step < 4; step++) await next(page)
  await page.getByRole("button", { name: "Créer l’article" }).click()
  await expect(
    page.getByRole("heading", { name: "Quel article ajoutez-vous ?" })
  ).toBeVisible()
  await expect(
    page.getByText("Un autre article porte déjà cette référence.")
  ).toBeVisible()
  await page.getByRole("button", { name: "Annuler" }).click()

  // Filtre par dépôt : chaque article n'apparaît que là où il est proposé.
  await page.getByRole("combobox", { name: "Tous les dépôts" }).click()
  await page.getByRole("option", { name: "Dépôt Bonabéri" }).click()
  await expect(
    page.getByRole("link", { name: /Carreau 60x60 beige/ })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: /Ciment/ })).toBeHidden()
  await page.getByRole("combobox", { name: "Tous les dépôts" }).click()
  await page.getByRole("option", { name: "Boutique Akwa" }).click()
  await expect(
    page.getByRole("link", { name: /Ciment CPJ 42,5/ })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: /Carreau/ })).toBeHidden()

  // Recherche par un morceau du nom.
  await page.getByRole("combobox", { name: "Tous les dépôts" }).click()
  await page.getByRole("option", { name: "Tous les dépôts" }).click()
  await page.getByRole("searchbox").fill("carr")
  await expect(
    page.getByRole("link", { name: /Carreau 60x60 beige/ })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: /Ciment/ })).toBeHidden()

  // Pagination : 26 articles de plus, créés directement par l'API avec la session de la page.
  await page.getByRole("searchbox").fill("")
  await page.evaluate(async (count) => {
    const token = Object.entries(localStorage).find(([key]) =>
      key.startsWith("kreskala.oidc.user")
    )?.[1]
    const organizationId = Object.entries(localStorage).find(([key]) =>
      key.startsWith("kreskala.active-organization.")
    )?.[1]
    const { access_token: accessToken } = JSON.parse(token ?? "{}")
    for (let index = 1; index <= count; index++) {
      await fetch("http://localhost:8081/v1/items", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Organization-Id": organizationId ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: `Vis ${String(index).padStart(2, "0")}`,
          baseUnit: "PIECE",
        }),
      })
    }
  }, 26)
  await page.goto("/articles?lignes=25")
  await expect(page.getByText("1–25 sur 28")).toBeVisible()
  await page.getByRole("button", { name: "Page suivante" }).click()
  await expect(page.getByText("26–28 sur 28")).toBeVisible()
  await expect(page).toHaveURL(/page=2/)
  await shot(page, testInfo, "07-articles-page-2")

  // Archivé, le ciment quitte la liste ; le filtre « Archivés » le retrouve.
  await page.goto("/articles")
  await page.getByRole("link", { name: /Ciment CPJ 42,5/ }).click()
  await dismissTour(page, "L’unité de comptage")
  await page.getByRole("button", { name: "Archiver" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Archiver" })
    .click()
  await expect(page.getByText("Article archivé.")).toBeVisible()
  await navigateTo(page, "Articles")
  await expect(
    page.getByRole("link", { name: /Carreau 60x60 beige/ })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: /Ciment/ })).toBeHidden()
  await page.getByRole("combobox", { name: "Statut" }).click()
  await page.getByRole("option", { name: "Archivés" }).click()
  await expect(
    page.getByRole("link", { name: /Ciment CPJ 42,5/ })
  ).toBeVisible()
  await expect(page).toHaveURL(/statut=archives/)

  // La fiche du dépôt montre ses articles ; son guide s'ouvre seul, puis se relance à la demande.
  await navigateTo(page, "Dépôts")
  await expect(
    page.getByRole("link", { name: /Dépôt Bonabéri.*1 article/ })
  ).toBeVisible()
  await page.getByRole("link", { name: /Dépôt Bonabéri/ }).click()
  await dismissTour(page, "Le type de lieu")
  await expect(
    page.getByRole("link", { name: "Carreau 60x60 beige" })
  ).toBeVisible()
  await shot(page, testInfo, "06-fiche-depot")
  await page.getByRole("button", { name: "Guide" }).click()
  await dismissTour(page, "Le type de lieu")
})
