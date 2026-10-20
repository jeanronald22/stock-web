import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"

import { expect, test, type Download, type Page } from "@playwright/test"

import {
  callApi,
  dismissTour,
  navigateTo,
  redirectApi,
  signUpWithBusiness,
  uploadItemPhoto,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

const fixture = (name: string) =>
  path.join(import.meta.dirname, "fixtures", name)

/** Enregistre le PDF téléchargé, vérifie qu'il en est un, et le rend en images pour la relecture. */
async function keep(download: Promise<Download>, name: string, out: string) {
  const file = await download
  const target = path.join(out, `${name}.pdf`)
  await file.saveAs(target)
  expect(readFileSync(target).subarray(0, 5).toString()).toBe("%PDF-")
  // Rendu des pages (pdftoppm, s'il est installé) : le PDF se relit comme une capture.
  try {
    execFileSync("pdftoppm", ["-png", "-r", "80", target, target.slice(0, -4)])
  } catch {
    // Sans pdftoppm, le PDF reste à ouvrir à la main.
  }
}

async function download(page: Page, action: () => Promise<void>) {
  const event = page.waitForEvent("download")
  await action()
  return event
}

/**
 * Les documents PDF (bon, fiches d'articles, étiquettes) d'une entreprise complète : logo, fiche,
 * articles avec photo et code-barres. Le même rendu sur tous les écrans : bureau seulement.
 */
test("documents PDF : bon, fiche article et étiquettes, au nom de l'entreprise", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "PDF identique partout")
  test.slow()
  await signUpWithBusiness(page, testInfo, "pdf")
  await dismissTour(page, "Tout est ici")

  // L'entreprise : son logo et sa fiche, qui signent ses documents.
  await navigateTo(page, "Paramètres")
  await page
    .locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]')
    .setInputFiles(fixture("logo-bello.png"))
  await expect(page.getByText("Logo enregistré.")).toBeVisible()
  await page.getByLabel("Nom et prénom").fill("Awa Bello")
  await page.getByLabel("Téléphone").fill("6 99 12 34 56")
  await page.getByLabel("Adresse du local").fill("Rue Joss, Akwa")
  await page
    .getByLabel("RCCM (registre du commerce)")
    .fill("RC/DLA/2019/B/1234")
  await page
    .getByLabel("NIU (numéro d’identifiant unique)")
    .fill("M012345678901A")
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click()
  await expect(page.getByText("Fiche enregistrée.")).toBeVisible()

  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
  })
  const cement = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: cement,
    name: "Ciment CPJ 42,5 — sac de 50 kg",
    baseUnit: "PIECE",
    barcode: "6181234567897",
    description:
      "Ciment Portland composé pour maçonnerie et béton courant. À stocker au sec, sur palette.",
    packagings: [{ name: "Palette", quantity: 40 }],
    warehouses: [{ warehouseId: depot, minQuantity: 80 }],
  })
  await uploadItemPhoto(page, cement, fixture("carreau.png"))
  const tile = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tile,
    name: "Carreau 60x60 beige",
    baseUnit: "SQUARE_METRE",
    batchTracking: true,
    packagings: [{ name: "Carton", quantity: 1.44 }],
    warehouses: [{ warehouseId: depot, minQuantity: null }],
  })
  const tap = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tap,
    name: "Robinet mélangeur",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: depot, minQuantity: null }],
  })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    counterparty: "Cimencam Douala",
    documentReference: "BL-2026-0457",
    note: "Deux sacs déchirés à la livraison, signalés au chauffeur.",
    lines: [
      { itemId: cement, quantity: 3, packagingName: "Palette" },
      { itemId: tile, quantity: 25, packagingName: "Carton", batch: "L240" },
      { itemId: tap, quantity: 12 },
    ],
  })

  const out = testInfo.outputPath()

  // Le bon, depuis la liste.
  await navigateTo(page, "Bons")
  await dismissTour(page, "Entrées et sorties")
  const number = await page
    .getByRole("row")
    .filter({ hasText: "REC-" })
    .getByRole("link", { name: /^REC-/ })
    .textContent()
  await keep(
    download(page, async () => {
      await page
        .getByRole("button", { name: `Actions du bon ${number}` })
        .click()
      await page.getByRole("menuitem", { name: "Télécharger le PDF" }).click()
    }),
    "bon",
    out
  )

  // La fiche de l'article, puis ses étiquettes (planche A4 et rouleau).
  await navigateTo(page, "Articles")
  await page.getByRole("link", { name: /^Ciment CPJ/ }).click()
  await keep(
    download(page, () =>
      page.getByRole("button", { name: "Exporter en PDF" }).click()
    ),
    "fiche",
    out
  )
  await page.getByRole("button", { name: "Autres actions" }).click()
  await page.getByRole("menuitem", { name: "Imprimer des étiquettes" }).click()
  await expect(
    page.getByRole("heading", { name: "Étiquettes", level: 1 })
  ).toBeVisible()
  await keep(
    download(page, () =>
      page.getByRole("button", { name: "Télécharger le PDF" }).click()
    ),
    "etiquettes-planche",
    out
  )
  await page.getByRole("radio", { name: /Rouleau/ }).click()
  await keep(
    download(page, () =>
      page.getByRole("button", { name: "Télécharger le PDF" }).click()
    ),
    "etiquettes-rouleau",
    out
  )
})
