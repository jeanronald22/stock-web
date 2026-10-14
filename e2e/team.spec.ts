import { expect, test } from "@playwright/test"

import { waitForActionLink } from "./mailbox"
import {
  callApi,
  dismissTour,
  navigateTo,
  PASSWORD,
  redirectApi,
  shot,
  signUpWithBusiness,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

test("une personne invitée rejoint l'équipe comme magasinière d'un seul dépôt", async ({
  page,
  browser,
}, testInfo) => {
  await signUpWithBusiness(page, testInfo, "equipe")
  await dismissTour(page, "Tout est ici")
  for (const name of ["Dépôt Bonabéri", "Boutique Akwa"])
    await callApi(page, "POST", "/v1/warehouses", {
      id: crypto.randomUUID(),
      name,
      kind: "WAREHOUSE",
    })

  // Invitation : une question par écran, puis le lien à partager.
  await navigateTo(page, "Équipe")
  await expect(
    page.getByRole("heading", { name: "Invitez votre équipe" })
  ).toBeVisible()
  await shot(page, testInfo, "00-equipe-vide")
  await page.getByRole("link", { name: "Inviter" }).click()
  const email = `invitee.${Date.now()}.${testInfo.project.name}@exemple.cm`
  const next = () => page.getByRole("button", { name: "Continuer" }).click()
  await expect(
    page.getByRole("heading", { name: "Qui invitez-vous ?" })
  ).toBeVisible()
  await page.getByLabel("Adresse e-mail").fill(email)
  await next()
  await expect(
    page.getByRole("heading", { name: "Quel rôle dans l’équipe ?" })
  ).toBeVisible()
  await next()
  await page.getByRole("radio", { name: /Magasinier/ }).click()
  await next()
  await expect(
    page.getByRole("heading", { name: "Dans quels dépôts ?" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Envoyer l’invitation" }).click()
  await expect(page.getByText("Choisissez au moins un dépôt.")).toBeVisible()
  await page.getByText("Dépôt Bonabéri").click()
  await shot(page, testInfo, "01-depots")
  await page.getByRole("button", { name: "Envoyer l’invitation" }).click()
  await expect(
    page.getByRole("heading", { name: "Invitation prête" })
  ).toBeVisible()
  const link = await page
    .getByRole("textbox", { name: "Lien d’invitation" })
    .inputValue()
  await shot(page, testInfo, "02-invitation-prete")
  await page.getByRole("button", { name: "Retour à l’équipe" }).click()
  await expect(page.getByRole("row").filter({ hasText: email })).toContainText(
    "Magasinier · Dépôt Bonabéri"
  )

  // La personne invitée ouvre le lien sans compte, le crée avec l'adresse invitée, puis rejoint.
  const context = await browser.newContext({
    viewport: page.viewportSize() ?? undefined,
  })
  await redirectApi(context)
  const guest = await context.newPage()
  await guest.goto(link)
  await expect(
    guest.getByRole("heading", {
      name: "Awa Bello vous invite à rejoindre Quincaillerie Bello",
    })
  ).toBeVisible()
  await shot(guest, testInfo, "03-lien")
  await guest.getByRole("button", { name: "Créer mon compte" }).click()
  await guest.getByLabel("Adresse e-mail").fill(email)
  await guest.getByRole("button", { name: "Continuer" }).click()
  await expect(
    guest.getByRole("heading", { name: "Consultez vos e-mails" })
  ).toBeVisible()
  await guest.goto(await waitForActionLink(email))
  await guest.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD)
  await guest.getByLabel("Confirmez le mot de passe").fill(PASSWORD)
  await guest.getByRole("button", { name: "Enregistrer et continuer" }).click()

  await guest.getByLabel("Prénom").fill("Paul")
  await guest.getByLabel("Nom", { exact: true }).fill("Etoga")
  await guest
    .getByRole("button", { name: "Rejoindre Quincaillerie Bello" })
    .click()
  await expect(
    guest.getByRole("heading", { name: "Bonjour Paul" })
  ).toBeVisible()
  await dismissTour(guest, "Tout est ici")

  // Magasinier : ses réceptions et sorties, pas le catalogue ni l'équipe ; son seul dépôt.
  // Le guide saute les étapes dont le bouton est masqué pour ce rôle (« Nouveau dépôt »…).
  await navigateTo(guest, "Dépôts")
  await expect(
    guest.getByRole("link", { name: /Dépôt Bonabéri/ })
  ).toBeVisible()
  await expect(guest.getByRole("link", { name: /Boutique Akwa/ })).toBeHidden()
  await expect(guest.getByRole("link", { name: "Nouveau dépôt" })).toBeHidden()
  await navigateTo(guest, "Articles")
  await expect(guest.getByRole("link", { name: "Nouvel article" })).toBeHidden()
  await navigateTo(guest, "Bons")
  await dismissTour(guest, "Entrées et sorties")
  await expect(
    guest.getByRole("link", { name: "Nouvelle réception" }).first()
  ).toBeVisible()
  await expect(
    guest
      .locator('[data-sidebar="sidebar"]')
      .getByRole("link", { name: "Équipe" })
  ).toBeHidden()
  await shot(guest, testInfo, "04-magasinier")
  await context.close()

  // Côté propriétaire : la personne est membre ; sa fiche change son accès Stock.
  await page.reload()
  const row = page.getByRole("row").filter({ hasText: "Paul Etoga" })
  await expect(row).toContainText("Magasinier · Dépôt Bonabéri")
  await shot(page, testInfo, "05-equipe")
  await row.getByRole("link", { name: "Paul Etoga" }).click()
  await expect(page.getByRole("heading", { name: "Paul Etoga" })).toBeVisible()
  await page.getByRole("radio", { name: /Contrôleur/ }).click()
  await page.getByText("Boutique Akwa").click()
  await page.getByRole("button", { name: "Enregistrer" }).click()
  await expect(
    page.getByText("Accès Stock de Paul Etoga enregistré.")
  ).toBeVisible()
  await shot(page, testInfo, "06-fiche-membre")
})
