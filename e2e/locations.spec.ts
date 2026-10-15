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

test("emplacements : créés sur la fiche du dépôt, choisis sur la fiche article, montrés à la sortie", async ({
  page,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "emplacements")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Magasin Akwa",
    kind: "SHOP",
  })
  for (const name of ["Robinet mélangeur", "Ciment 50 kg"])
    await callApi(page, "POST", "/v1/items", {
      id: crypto.randomUUID(),
      name,
      baseUnit: "PIECE",
      warehouses: [{ warehouseId: depot }],
    })

  // Fiche du dépôt : les emplacements se notent là.
  await navigateTo(page, "Dépôts")
  await dismissTour(page, "Vos lieux de stock")
  await page.getByRole("link", { name: /Magasin Akwa/ }).click()
  await expect(
    page.getByRole("heading", { name: "Magasin Akwa", level: 1 })
  ).toBeVisible()
  await page.getByRole("button", { name: "Ajouter un emplacement" }).click()
  await page.getByLabel("Code").fill("a-03-2")
  await page
    .getByLabel("Libellé (facultatif)")
    .fill("Allée A, rayon 3, niveau 2")
  await page.getByRole("button", { name: "Ajouter", exact: true }).click()
  await expect(page.getByText("Emplacement A-03-2 ajouté.")).toBeVisible()
  await expect(page.getByText("A-03-2", { exact: true })).toBeVisible()

  // Fiche article : on range l'article, ou on crée l'emplacement sur place.
  await navigateTo(page, "Articles")
  await dismissTour(page, "Votre catalogue")
  await page.getByRole("link", { name: "Robinet mélangeur" }).click()
  await page
    .getByRole("button", { name: "Emplacement de Robinet mélangeur" })
    .click()
  await page.getByRole("option", { name: /A-03-2/ }).click()
  await expect(page.getByText("· Allée A, rayon 3, niveau 2")).toBeVisible()
  await shot(page, testInfo, "01-fiche-article")

  await navigateTo(page, "Articles")
  await page.getByRole("link", { name: "Ciment 50 kg" }).click()
  await page
    .getByRole("button", { name: "Emplacement de Ciment 50 kg" })
    .click()
  await page.getByPlaceholder("Code ou libellé").fill("C-07")
  await shot(page, testInfo, "02-creer-sur-place")
  await page.getByRole("option", { name: /Créer « C-07 »/ }).click()
  await expect(
    page.getByRole("button", { name: "Emplacement de Ciment 50 kg" })
  ).toContainText("C-07")

  // À la sortie, l'emplacement dit où prendre l'article.
  await navigateTo(page, "Articles")
  await page.getByRole("link", { name: "Robinet mélangeur" }).click()
  await expect(
    page.getByRole("heading", { name: "Robinet mélangeur", level: 1 })
  ).toBeVisible()
  await expect(page.getByText("En stock dans vos dépôts")).toBeVisible()
  await page.getByRole("button", { name: "Autres actions" }).click()
  await page
    .getByRole("menuitem", { name: "Nouvelle sortie de cet article" })
    .click()
  await expect(
    page
      .locator("li")
      .filter({ hasText: "Robinet mélangeur" })
      .getByText("A-03-2")
  ).toBeVisible()
  await shot(page, testInfo, "03-sortie")

  // Le dépôt compte les articles rangés à chaque emplacement.
  await navigateTo(page, "Dépôts")
  await page.getByRole("link", { name: /Magasin Akwa/ }).click()
  await expect(
    page.getByRole("listitem").filter({ hasText: "A-03-2" })
  ).toContainText("1 article")
  await shot(page, testInfo, "04-depot")
})
