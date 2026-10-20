import fs from "node:fs"

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

/**
 * CSV tel qu'Excel l'enregistre en français : « ; », encodage Windows, titres à sa façon. Deux
 * lignes à corriger : une unité inconnue, une référence en double.
 */
const CATALOG_CSV = [
  "Désignation;Réf;Unité;Famille;Conditionnement;Quantité par conditionnement;Suivi par lot;Seuil;Stock actuel;Lot",
  "Carreau 30x30 gris;CAR-3030;Pièce;Carrelage > Mur;Carton;10;Oui;50;120;L77",
  "Ciment 50 kg;CIM-50;pce;Maçonnerie;;;Non;10;40;",
  "Fer à béton 8 mm;FER-8;m;Maçonnerie;;;;;250,5;",
  "Sable fin;SAB;sac;;;;;;;",
  "Colle carrelage;CIM-50;Pièce;;;;;;;",
].join("\r\n")

test("import d'un catalogue Excel, conditionnement par défaut, étiquettes", async ({
  page,
}, testInfo) => {
  test.slow()
  await signUpWithBusiness(page, testInfo, "import")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Magasin Akwa",
    kind: "SHOP",
  })

  // Catalogue vide : l'import est proposé à côté de la création.
  await navigateTo(page, "Articles")
  await page.getByRole("link", { name: "Ou importer un fichier Excel" }).click()
  await expect(
    page.getByRole("heading", { name: "Importez votre catalogue" })
  ).toBeVisible()
  const csv = testInfo.outputPath("catalogue.csv")
  fs.writeFileSync(csv, Buffer.from(CATALOG_CSV, "latin1"))
  await page.locator("input[type=file]").setInputFiles(csv)
  await expect(page.getByText("5 lignes trouvées")).toBeVisible()
  await shot(page, testInfo, "01-fichier")
  await page.getByRole("button", { name: "Continuer" }).click()

  // Colonnes reconnues d'après leurs titres, avec une valeur du fichier.
  await expect(
    page.getByRole("heading", { name: "Vérifiez les colonnes" })
  ).toBeVisible()
  await expect(
    page.getByText("Dans le fichier : Carreau 30x30 gris")
  ).toBeVisible()
  await expect(
    page.getByText("Dans le fichier : Carrelage > Mur")
  ).toBeVisible()
  await shot(page, testInfo, "02-colonnes")
  await page.getByRole("button", { name: "Continuer" }).click()

  // Un seul dépôt : coché, et c'est là que le stock est posé.
  await expect(
    page.getByRole("heading", { name: "Où sont ces articles ?" })
  ).toBeVisible()
  await expect(page.getByRole("checkbox")).toBeChecked()
  await page.getByRole("button", { name: "Continuer" }).click()

  await expect(
    page.getByRole("heading", { name: "Tout est prêt ?" })
  ).toBeVisible()
  await expect(page.getByText("Ligne 5")).toBeVisible()
  await expect(page.getByText(/unité inconnue/)).toBeVisible()
  await expect(page.getByText(/référence déjà vue plus haut/)).toBeVisible()
  await expect(
    page.getByText(
      "3 articles arrivent avec leur stock, posé dans Magasin Akwa."
    )
  ).toBeVisible()
  await shot(page, testInfo, "03-verification")
  await page.getByRole("button", { name: "Importer 3 articles" }).click()

  await expect(
    page.getByRole("heading", { name: "3 articles importés" })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: `AJU-${year}-0001` })
  ).toBeVisible()
  await shot(page, testInfo, "04-bilan")
  await page.getByRole("button", { name: "Voir les articles" }).click()
  await dismissTour(page, "Votre catalogue")
  await expect(
    page.getByRole("link", { name: "Fer à béton 8 mm" })
  ).toBeVisible()

  // Le modèle téléchargé se réimporte tel quel (classeur Excel).
  await page.getByRole("button", { name: "Options du catalogue" }).click()
  await page
    .getByRole("menuitem", { name: "Importer un fichier Excel" })
    .click()
  const download = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Télécharger le modèle Excel" })
    .click()
  const template = testInfo.outputPath("modele.xlsx")
  await (await download).saveAs(template)
  await page.locator("input[type=file]").setInputFiles(template)
  await expect(page.getByText("2 lignes trouvées")).toBeVisible()
  for (let step = 0; step < 3; step++)
    await page.getByRole("button", { name: "Continuer" }).click()
  await page.getByRole("button", { name: "Importer 2 articles" }).click()
  await expect(
    page.getByRole("heading", { name: "2 articles importés" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Voir les articles" }).click()

  // Le carton du fichier est proposé d'office en réception.
  await page.getByRole("link", { name: "Carreau 60x60 beige" }).click()
  await expect(
    page.getByText("par défaut en réception et en sortie")
  ).toBeVisible()
  await page.getByRole("button", { name: "Autres actions" }).click()
  await page
    .getByRole("menuitem", { name: "Nouvelle réception de cet article" })
    .click()
  await expect(
    page.getByRole("combobox", { name: "Unité · Carreau 60x60 beige" })
  ).toHaveText(/Carton/)
  await shot(page, testInfo, "05-reception-en-cartons")

  // Étiquettes : un article sans code en reçoit un, puis le PDF.
  await navigateTo(page, "Articles")
  await page.getByRole("link", { name: "Robinet mélangeur" }).click()
  await expect(
    page.getByRole("heading", { name: "Robinet mélangeur", level: 1 })
  ).toBeVisible()
  await expect(
    page.getByRole("tab", { name: "Informations générales" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Autres actions" }).click()
  await page.getByRole("menuitem", { name: "Imprimer des étiquettes" }).click()
  await expect(
    page.getByRole("heading", { name: "Étiquettes", level: 1 })
  ).toBeVisible()
  await expect(page.getByText("1 article n’a pas de code-barres")).toBeVisible()
  await page.getByRole("button", { name: "Lui attribuer un code" }).click()
  await expect(page.getByText(/^2\d{12}$/).first()).toBeVisible()
  await page.getByRole("radio", { name: /Rouleau/ }).click()
  await expect(page.getByText("1 étiquette")).toBeVisible()
  await shot(page, testInfo, "06-etiquettes")
  const pdf = page.waitForEvent("download")
  await page.getByRole("button", { name: "Télécharger le PDF" }).click()
  expect((await pdf).suggestedFilename()).toBe("etiquettes.pdf")

  // Depuis une réception : une étiquette par carton reçu.
  const items = await callApi<{ items: { id: string; name: string }[] }>(
    page,
    "GET",
    "/v1/items?q=Carreau%2060x60"
  )
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    lines: [
      {
        itemId: items.items[0].id,
        quantity: 5,
        packagingName: "Carton",
        batch: "L2410",
      },
    ],
  })
  await navigateTo(page, "Bons")
  await page.getByRole("link", { name: new RegExp(`REC-${year}-0001`) }).click()
  await page.getByRole("link", { name: "Étiquettes" }).click()
  await expect(
    page.getByRole("textbox", {
      name: "Nombre d’étiquettes pour Carreau 60x60 beige",
    })
  ).toHaveValue("5")
})
