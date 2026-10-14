import { expect, test, type Page } from "@playwright/test"

import {
  dismissTour,
  navigateTo,
  redirectApi,
  shot,
  signUpWithBusiness,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

async function createWarehouse(page: Page, name: string, kind: string) {
  await page.getByRole("link", { name: "Nouveau dépôt" }).first().click()
  await page.getByRole("radio", { name: new RegExp(kind) }).click()
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

  await page.getByRole("link", { name: "Nouveau dépôt" }).first().click()
  await dismissTour(page, "Le type de lieu")
  await page.getByRole("button", { name: "Annuler" }).click()
  await createWarehouse(page, "Dépôt Bonabéri", "Dépôt")
  await createWarehouse(page, "Boutique Akwa", "Boutique")
  await shot(page, testInfo, "02-depots")

  await navigateTo(page, "Articles")
  await expect(
    page.getByRole("heading", { name: "Créez votre premier article" })
  ).toBeVisible()
  await dismissTour(page, "Votre catalogue")
  await page.getByRole("link", { name: "Nouvel article" }).first().click()
  await dismissTour(page, "L’unité de comptage")

  // Carreau : compté au m², vendu par carton de 1,44 m², proposé au seul dépôt de Bonabéri.
  await page.getByLabel("Nom", { exact: true }).fill("Carreau 60x60 beige")
  await page.getByRole("radio", { name: /Mètre carré/ }).click()
  await page.getByRole("button", { name: "Ajouter un conditionnement" }).click()
  await page.getByRole("textbox", { name: "Nom" }).last().fill("Carton")
  await page.getByRole("textbox", { name: "Contient" }).fill("1,44")
  await expect(page.getByText("1 Carton = 1,44 m²")).toBeVisible()
  await page.getByText("Dépôt Bonabéri").click()
  await shot(page, testInfo, "03-nouvel-article")
  await page.getByRole("button", { name: "Créer l’article" }).click()
  await expect(
    page.getByRole("link", { name: /Carreau 60x60 beige/ })
  ).toBeVisible()

  // Ciment : compté à la pièce ; 2,5 sacs dans un conditionnement est refusé.
  await page.getByRole("link", { name: "Nouvel article" }).click()
  await page.getByLabel("Nom", { exact: true }).fill("Ciment CPJ 42,5")
  await page.getByRole("button", { name: "Ajouter un conditionnement" }).click()
  await page.getByRole("textbox", { name: "Nom" }).last().fill("Palette")
  await page.getByRole("textbox", { name: "Contient" }).fill("2,5")
  await page.getByText("Boutique Akwa").click()
  await page.getByRole("button", { name: "Créer l’article" }).click()
  await expect(page.getByText("Un nombre entier de pièces.")).toBeVisible()
  await page.getByRole("textbox", { name: "Contient" }).fill("40")
  await page.getByRole("button", { name: "Créer l’article" }).click()
  await expect(
    page.getByRole("link", { name: /Ciment CPJ 42,5/ })
  ).toBeVisible()
  await shot(page, testInfo, "04-articles")

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

  // Le dépôt affiche les articles qui y sont proposés.
  await navigateTo(page, "Dépôts")
  await expect(
    page.getByRole("link", { name: /Dépôt Bonabéri.*1 article/ })
  ).toBeVisible()
  await page.getByRole("link", { name: /Dépôt Bonabéri/ }).click()
  await expect(
    page.getByRole("link", { name: "Carreau 60x60 beige" })
  ).toBeVisible()
  await shot(page, testInfo, "05-fiche-depot")

  // Le guide se relance à la demande.
  await page.getByRole("button", { name: "Guide" }).click()
  await dismissTour(page, "Le type de lieu")
})
