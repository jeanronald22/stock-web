import { expect, test } from "@playwright/test"

import { waitForActionLink, waitForMail } from "./mailbox"
import {
  callApi,
  dismissTour,
  navigateTo,
  openNavigation,
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
  const ownerEmail = await signUpWithBusiness(page, testInfo, "equipe")
  await dismissTour(page, "Tout est ici")
  const bonaberi = crypto.randomUUID()
  for (const [id, name] of [
    [bonaberi, "Dépôt Bonabéri"],
    [crypto.randomUUID(), "Boutique Akwa"],
  ])
    await callApi(page, "POST", "/v1/warehouses", {
      id,
      name,
      kind: "WAREHOUSE",
    })
  // Un câble suivi à Bonabéri (seuil 50 m), avec 80 m en stock.
  const cable = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: cable,
    name: "Câble 2,5 mm²",
    baseUnit: "METRE",
    warehouses: [{ warehouseId: bonaberi, minQuantity: 50 }],
  })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: bonaberi,
    lines: [{ itemId: cable, quantity: 80 }],
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
  await dismissTour(guest, "Retrouvez vite")
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
  // Sa sortie fait passer le câble sous le seuil : le propriétaire sera prévenu.
  await callApi(guest, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "ISSUE",
    warehouseId: bonaberi,
    lines: [{ itemId: cable, quantity: 40 }],
  })
  await context.close()

  // Notifications du propriétaire : l'arrivée de Paul, puis l'alerte de stock, aussi par e-mail.
  await expect(async () => {
    await page.reload()
    await expect(
      page.getByRole("button", { name: "Notifications, 2 non lues" })
    ).toBeVisible({ timeout: 2_000 })
  }).toPass()
  await page.getByRole("button", { name: "Notifications, 2 non lues" }).click()
  const panel = page.getByRole("dialog", { name: "Notifications" })
  await expect(panel).toContainText("1 article à commander · Dépôt Bonabéri")
  await expect(panel).toContainText("Câble 2,5 mm² : 40 m (seuil 50 m)")
  await expect(panel).toContainText("Paul Etoga a rejoint l’équipe")
  await shot(page, testInfo, "05a-notifications")
  await page.keyboard.press("Escape")
  // Menus en mode clair : fond clair (le thème des composants forçait le mode sombre).
  await openNavigation(page)
  await page.getByRole("button", { name: "Ouvrir le menu du compte" }).click()
  await shot(page, testInfo, "05b-menu-clair")
  // Ferme le menu, puis le panneau latéral sur téléphone (sans effet ailleurs).
  await page.keyboard.press("Escape")
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Notifications, 2 non lues" }).click()
  await panel.getByRole("button", { name: "Tout marquer comme lu" }).click()
  await expect(panel).toContainText("Tout est lu.")
  await page.keyboard.press("Escape")
  expect(await waitForMail(ownerEmail, "1 article à commander")).toContain(
    "Câble 2,5 mm² : 40 m, seuil 50 m (stock bas)"
  )

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

test("une personne déjà inscrite rejoint l'équipe depuis son accueil, sans le lien", async ({
  page,
  browser,
}, testInfo) => {
  // Paul a déjà son compte et sa propre entreprise.
  const context = await browser.newContext({
    viewport: page.viewportSize() ?? undefined,
  })
  await redirectApi(context)
  const paul = await context.newPage()
  const paulEmail = await signUpWithBusiness(paul, testInfo, "deja-inscrit")
  await dismissTour(paul, "Tout est ici")

  await signUpWithBusiness(page, testInfo, "proprietaire")
  await dismissTour(page, "Tout est ici")
  await navigateTo(page, "Équipe")
  await page.getByRole("link", { name: "Inviter" }).click()
  await page.getByLabel("Adresse e-mail").fill(paulEmail)
  const next = () => page.getByRole("button", { name: "Continuer" }).click()
  await next()
  await next()
  await page.getByRole("radio", { name: /Gérant/ }).click()
  await page.getByRole("button", { name: "Envoyer l’invitation" }).click()
  await expect(
    page.getByRole("heading", { name: "Invitation prête" })
  ).toBeVisible()

  // Son accueil annonce l'invitation ; il la rejoint et y entre directement.
  await paul.reload()
  const invitations = paul.getByRole("region", { name: "Invitation reçue" })
  await expect(invitations).toContainText("Awa Bello vous invite · Membre")
  await shot(paul, testInfo, "01-invitation-recue")
  await invitations.getByRole("button", { name: "Rejoindre" }).click()
  await expect(
    paul.getByText("Bienvenue dans l’équipe de Quincaillerie Bello.")
  ).toBeVisible()
  await expect(
    paul.getByRole("region", { name: "Invitation reçue" })
  ).toBeHidden()
  await context.close()
})
