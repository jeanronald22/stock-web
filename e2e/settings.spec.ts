import { expect, test, type Page } from "@playwright/test"

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

/** Un PDF minimal : l'API ne reconnaît le format qu'à sa signature. */
const proof = (name: string) => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n% justificatif\n"),
})

/** La carte d'une pièce, par son nom. */
const documentCard = (page: Page, name: string) =>
  page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })

/**
 * Paramètres (D45) : la fiche de l'entreprise et son KYB, les pièces chiffrées, la demande de
 * vérification ; un magasinier n'y voit que ses notifications.
 */
test("paramètres : fiche de l'entreprise, pièces et demande de vérification", async ({
  page,
  browser,
}, testInfo) => {
  test.slow()
  await signUpWithBusiness(page, testInfo, "kyb")
  await dismissTour(page, "Tout est ici")

  // Le tableau de bord ne règle plus rien : tout est dans « Paramètres ».
  await expect(
    page.getByRole("button", { name: "Régler les alertes" })
  ).toHaveCount(0)
  await navigateTo(page, "Paramètres")
  await expect(page).toHaveURL(/\/parametres\/entreprise$/)
  const kyb = page.getByRole("region", { name: "Vérification de l’entreprise" })
  await expect(kyb.getByText("Non déclarée", { exact: true })).toBeVisible()
  for (const tab of [
    "Entreprise",
    "Alertes",
    "Règles de travail",
    "Notifications",
  ])
    await expect(
      page.getByRole("link", { name: tab, exact: true })
    ).toBeVisible()
  await shot(page, testInfo, "01-entreprise")

  // Le logo s'enregistre dès le dépôt et remplace les initiales dans le sélecteur d'entreprise.
  const switcher = page.getByRole("button", { name: "Changer d’entreprise" })
  await expect(switcher.locator("img")).toHaveCount(0)
  await page
    .locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]')
    .setInputFiles("e2e/fixtures/carreau.png")
  await expect(page.getByText("Logo enregistré.")).toBeVisible()
  await expect(switcher.locator("img")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Remplacer" }).first()
  ).toBeVisible()
  await shot(page, testInfo, "01b-logo")

  // La fiche : le téléphone et les identifiants sont normalisés par l'API.
  await expect(page.getByLabel("Nom de l’entreprise")).toHaveValue(
    "Quincaillerie Bello"
  )
  await page.getByLabel("Nom et prénom").fill("Awa Bello")
  await page.getByLabel("Téléphone").fill("12")
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click()
  await expect(
    page.getByText(
      "Indiquez un numéro de téléphone complet, par exemple 6 99 12 34 56."
    )
  ).toBeVisible()
  await page.getByLabel("Téléphone").fill("6 99 12 34 56")
  await page.getByLabel("Adresse du local").fill("Rue Joss, Akwa")
  await page
    .getByLabel("RCCM (registre du commerce)")
    .fill("rc/dla/2019/b/1234")
  await page
    .getByLabel("NIU (numéro d’identifiant unique)")
    .fill("M012345678901A")
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click()
  await expect(page.getByText("Fiche enregistrée.")).toBeVisible()
  // Avec l'adresse, la photo du local n'est plus demandée.
  await expect(
    documentCard(page, "Photo du local").getByText(
      "Facultative : l’adresse suffit au niveau 1"
    )
  ).toBeVisible()
  await expect(page.getByLabel("Téléphone")).toHaveValue("+237699123456")
  await expect(page.getByLabel("RCCM (registre du commerce)")).toHaveValue(
    "RC/DLA/2019/B/1234"
  )

  // La pièce du gérant donne le niveau 1 ; un fichier qui n'est ni photo ni PDF est refusé.
  const managerId = documentCard(page, "Pièce d’identité du gérant")
  await managerId.locator('input[type="file"]').setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("pas une pièce"),
  })
  await expect(
    page.getByText("Déposez une photo (JPEG, PNG, WebP) ou un PDF.")
  ).toBeVisible()
  await managerId
    .locator('input[type="file"]')
    .setInputFiles("e2e/fixtures/carreau.png")
  await expect(page.getByText("Pièce déposée.")).toBeVisible()
  await expect(kyb.getByText("Déclarée", { exact: true })).toBeVisible()
  await expect(managerId.getByText(/^Déposée le /)).toBeVisible()

  // Lue par l'API, avec la session : l'aperçu s'ouvre dans l'écran.
  await managerId.getByRole("button", { name: "Voir" }).click()
  const preview = page.getByRole("dialog", {
    name: "Pièce d’identité du gérant",
  })
  await expect(preview.locator("img")).toBeVisible()
  await shot(page, testInfo, "02-apercu-piece")
  await page.keyboard.press("Escape")
  await expect(preview).toBeHidden()

  // Les justificatifs déposés, la vérification se demande.
  await documentCard(page, "Justificatif RCCM")
    .locator('input[type="file"]')
    .setInputFiles(proof("rccm.pdf"))
  await expect(
    documentCard(page, "Justificatif RCCM").getByText(/^Déposée le /)
  ).toBeVisible()
  await documentCard(page, "Justificatif NIU")
    .locator('input[type="file"]')
    .setInputFiles(proof("niu.pdf"))
  await expect(
    kyb.getByText("Tout est déposé : demandez la vérification à Kreskala.")
  ).toBeVisible()
  await kyb.getByRole("button", { name: "Demander la vérification" }).click()
  await expect(
    kyb.getByText("En attente de vérification", { exact: true })
  ).toBeVisible()
  await expect(
    kyb.getByRole("button", { name: "Demander la vérification" })
  ).toHaveCount(0)
  await shot(page, testInfo, "03-verification-demandee")

  // Retirer la pièce du gérant ramène au niveau 0 et annule la demande.
  await managerId.getByRole("button", { name: "Retirer" }).click()
  await page
    .getByRole("alertdialog", { name: "Retirer cette pièce ?" })
    .getByRole("button", { name: "Retirer" })
    .click()
  await expect(page.getByText("Pièce retirée.")).toBeVisible()
  await expect(kyb.getByText("Non déclarée", { exact: true })).toBeVisible()
  await expect(
    kyb.getByRole("link", { name: "Pièce d’identité du gérant" })
  ).toBeVisible()

  // Les autres onglets.
  await page.getByRole("link", { name: "Règles de travail" }).click()
  await expect(
    page.getByRole("switch", {
      name: "Les sorties des magasiniers passent par une validation",
    })
  ).toBeVisible()
  await page.getByRole("link", { name: "Notifications", exact: true }).click()
  await expect(
    page.getByText("Recevoir aussi par e-mail").first()
  ).toBeVisible()
  await shot(page, testInfo, "04-notifications")

  // Un magasinier n'a que ses notifications ; la fiche de l'entreprise lui est fermée.
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Dépôt Akwa",
    kind: "WAREHOUSE",
  })
  const storekeeper = await joinTeam(page, browser, testInfo, "STOREKEEPER", [
    depot,
  ])
  await navigateTo(storekeeper, "Paramètres")
  await expect(storekeeper).toHaveURL(/\/parametres\/notifications$/)
  await expect(
    storekeeper.getByRole("link", { name: "Entreprise", exact: true })
  ).toHaveCount(0)
  await storekeeper.goto("/parametres/entreprise")
  await expect(storekeeper.getByText("Réglage réservé")).toBeVisible()
  await shot(storekeeper, testInfo, "05-magasinier")
})
