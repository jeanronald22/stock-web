import {
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test"

import { waitForActionLink } from "./mailbox"

export const PASSWORD = "un carton bien rangé"
const MOBILE_MAX_WIDTH = 767

/**
 * API à tester à la place de celle de l'application (E2E_API_URL) : permet de vérifier une
 * branche de l'API sans toucher à celle qui tourne déjà sur le poste.
 */
export async function redirectApi(context: BrowserContext) {
  const target = process.env.E2E_API_URL
  const source = process.env.E2E_APP_API_URL ?? "http://localhost:8081"
  if (!target) return
  // continue (et non fetch + fulfill) : la requête part telle quelle, corps binaire compris (photos).
  await context.route(`${source}/**`, (route) =>
    route.continue({ url: route.request().url().replace(source, target) })
  )
}

/**
 * Les écrans s'animent à l'apparition : la capture attend leur état final. Les animations en boucle
 * des illustrations (carton qui flotte) ne finissent jamais et sont ignorées.
 */
export async function shot(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity
        )
        // Une animation annulée en route (notification qui disparaît) ne bloque pas la capture.
        .map((animation) => animation.finished.catch(() => undefined))
    )
  )
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
  })
}

/** Le guide s'ouvre seul à la première visite d'un écran : on vérifie son titre, puis on le ferme. */
export async function dismissTour(page: Page, title: string) {
  const popover = page.locator(".driver-popover")
  await expect(popover.getByText(title)).toBeVisible()
  await popover.locator(".driver-popover-close-btn").click()
  await expect(popover).toBeHidden()
}

/** Sur téléphone, le menu latéral s'ouvre d'abord par le bouton de l'en-tête. */
export async function openNavigation(page: Page) {
  if ((page.viewportSize()?.width ?? 0) <= MOBILE_MAX_WIDTH) {
    await page
      .getByRole("button", { name: "Afficher ou masquer le menu" })
      .click()
  }
}

export async function navigateTo(page: Page, entry: string) {
  await openNavigation(page)
  await page.getByRole("link", { name: entry, exact: true }).click()
}

/** Inscription complète d'un nouveau client, jusqu'à l'accueil de son espace. */
export async function signUpWithBusiness(
  page: Page,
  testInfo: TestInfo,
  prefix: string
) {
  const email = `${prefix}.${Date.now()}.${testInfo.project.name}@exemple.cm`
  await page.goto("/connexion")
  await page.getByRole("link", { name: "Créer un compte" }).click()
  await page.getByLabel("Adresse e-mail").fill(email)
  await page.getByRole("button", { name: "Continuer" }).click()
  await expect(
    page.getByRole("heading", { name: "Consultez vos e-mails" })
  ).toBeVisible()
  await page.goto(await waitForActionLink(email))
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD)
  await page.getByLabel("Confirmez le mot de passe").fill(PASSWORD)
  await page.getByRole("button", { name: "Enregistrer et continuer" }).click()
  await page.getByLabel("Prénom").fill("Awa")
  await page.getByLabel("Nom", { exact: true }).fill("Bello")
  await page.getByRole("button", { name: "Continuer" }).click()
  await page.getByLabel("Nom de l’entreprise").fill("Quincaillerie Bello")
  await page.getByLabel("Ville").fill("Douala")
  await page.getByLabel("Activité").click()
  await page.getByRole("option", { name: "Quincaillerie" }).click()
  await page.getByRole("button", { name: "Créer mon espace" }).click()
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click()
  await expect(page.getByRole("heading", { name: "Bonjour Awa" })).toBeVisible()
  return email
}
