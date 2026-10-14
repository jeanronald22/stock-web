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

  // Invitation : adresse, rôle Stock et dépôt ; le lien s'affiche pour être partagé.
  await navigateTo(page, "Équipe")
  await page.getByRole("button", { name: "Inviter" }).click()
  const sheet = page.getByRole("dialog", { name: "Inviter une personne" })
  const email = `invitee.${Date.now()}.${testInfo.project.name}@exemple.cm`
  await sheet.getByLabel("Adresse e-mail").fill(email)
  await sheet.getByRole("radio", { name: /Magasinier/ }).click()
  await sheet.getByText("Dépôt Bonabéri").click()
  await sheet.getByRole("button", { name: "Envoyer l’invitation" }).click()
  const link = await sheet
    .getByRole("textbox", { name: "Lien d’invitation" })
    .inputValue()
  await shot(page, testInfo, "01-invitation")
  await sheet.getByRole("button", { name: "Fermer" }).click()
  await expect(
    page.getByRole("listitem").filter({ hasText: email })
  ).toContainText("Magasinier · Dépôt Bonabéri")

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
  await shot(guest, testInfo, "02-lien")
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
  await shot(guest, testInfo, "03-magasinier")
  await context.close()

  // Côté propriétaire : la personne est membre, avec son accès Stock.
  await page.reload()
  await expect(
    page.getByRole("listitem").filter({ hasText: "Paul Etoga" })
  ).toContainText("Magasinier · Dépôt Bonabéri")
  await shot(page, testInfo, "04-equipe")
})
