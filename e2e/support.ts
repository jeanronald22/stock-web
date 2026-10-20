import {
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test"

import { waitForActionLink } from "./mailbox"

export const PASSWORD = "un carton bien rangé"
const MOBILE_MAX_WIDTH = 767
/** En dessous du point « sm » (640 px), les filtres des listes passent dans un panneau (FilterBar). */
const FILTERS_FOLDED_MAX_WIDTH = 639

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

/**
 * Sur téléphone, les filtres d'une liste sont rangés dans un panneau du bas : on l'ouvre, on agit,
 * puis on revient à la liste. Ailleurs, au-delà de deux filtres, ils sont dans le menu « Filtres » ;
 * sinon, l'action se fait directement dans la barre.
 */
export async function withFilters(page: Page, action: () => Promise<void>) {
  const opener = page.getByRole("button", { name: /^Filtres/ })
  if ((page.viewportSize()?.width ?? 0) <= FILTERS_FOLDED_MAX_WIDTH) {
    await opener.click()
    await action()
    await page.getByRole("button", { name: "Voir les résultats" }).click()
    return
  }
  // La barre s'affiche d'un bloc : visible, elle dit si ses filtres sont dans un menu.
  await expect(page.locator('[data-slot="filter-bar"]')).toBeVisible()
  const menu = await opener.isVisible()
  if (menu) await opener.click()
  await action()
  if (menu) {
    const panel = page.getByRole("dialog", { name: "Filtres" })
    if (await panel.isVisible()) await page.keyboard.press("Escape")
    await expect(panel).toBeHidden()
  }
}

/** Carte d'un article dans la grille (affichage par défaut d'« Articles » et « Stock »). */
export function itemCard(page: Page, name: RegExp | string) {
  return page
    .getByRole("listitem")
    .filter({ has: page.getByRole("link", { name }) })
}

/** Jour tel que le calendrier le marque (data-day, format de la langue française). */
function calendarDay(day: string) {
  return new Date(`${day}T12:00:00`).toLocaleDateString("fr")
}

/** Mois parcourus au plus pour trouver un jour dans le calendrier. */
const CALENDAR_MAX_STEPS = 24

/**
 * Choisit une période sur le calendrier ([from] et [to] en AAAA-MM-JJ, dans le passé) : on recule
 * de mois en mois jusqu'au premier jour, puis on avance jusqu'au dernier, et on applique.
 * [beforeApply] : pour photographier le calendrier ouvert.
 */
export async function pickPeriod(
  page: Page,
  label: string,
  from: string,
  to: string,
  beforeApply?: () => Promise<void>
) {
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click()
  const calendar = page.locator('[data-slot="calendar"]')
  const day = (value: string) =>
    calendar.locator(
      `td:not(.rdp-outside) > button[data-day="${calendarDay(value)}"]`
    )
  for (const [value, step] of [
    [from, ".rdp-button_previous"],
    [to, ".rdp-button_next"],
  ] as const) {
    for (let moves = 0; !(await day(value).isVisible()); moves++) {
      if (moves === CALENDAR_MAX_STEPS)
        throw new Error(`Jour ${value} introuvable dans le calendrier`)
      await calendar.locator(step).click()
    }
    await day(value).click()
  }
  await beforeApply?.()
  await page.getByRole("button", { name: "Appliquer" }).click()
}

export async function navigateTo(page: Page, entry: string) {
  await openNavigation(page)
  // Le menu latéral seulement : un fil d'Ariane peut porter le même nom.
  await page
    .locator('[data-sidebar="sidebar"]')
    .getByRole("link", { name: entry, exact: true })
    .click()
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

/**
 * Appel à l'API avec la session de la page (jeton et entreprise active) : prépare des données
 * sans repasser par les écrans. Passe par l'adresse de l'application, donc par redirectApi.
 */
export async function callApi<T>(
  page: Page,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const source = process.env.E2E_APP_API_URL ?? "http://localhost:8081"
  return page.evaluate(
    async ({ method, url, body }) => {
      const entries = Object.entries(localStorage)
      const user = entries.find(([key]) =>
        key.startsWith("kreskala.oidc.user")
      )?.[1]
      const organizationId =
        entries.find(([key]) =>
          key.startsWith("kreskala.active-organization.")
        )?.[1] ?? ""
      const { access_token: accessToken } = JSON.parse(user ?? "{}")
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Organization-Id": organizationId,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      if (!response.ok)
        throw new Error(
          `${method} ${url} : ${response.status} ${await response.text()}`
        )
      return response.json()
    },
    { method, url: source + path, body }
  ) as Promise<T>
}

/** Dépose une photo sur un article, avec la session de la page (multipart, comme l'application). */
export async function uploadItemPhoto(
  page: Page,
  itemId: string,
  filePath: string
) {
  const source = process.env.E2E_APP_API_URL ?? "http://localhost:8081"
  const base64 = (await import("node:fs"))
    .readFileSync(filePath)
    .toString("base64")
  await page.evaluate(
    async ({ url, base64 }) => {
      const entries = Object.entries(localStorage)
      const user = entries.find(([key]) =>
        key.startsWith("kreskala.oidc.user")
      )?.[1]
      const organizationId =
        entries.find(([key]) =>
          key.startsWith("kreskala.active-organization.")
        )?.[1] ?? ""
      const { access_token: accessToken } = JSON.parse(user ?? "{}")
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
      const body = new FormData()
      body.append("file", new File([bytes], "photo.png", { type: "image/png" }))
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Organization-Id": organizationId,
        },
        body,
      })
      if (!response.ok)
        throw new Error(`Photo : ${response.status} ${await response.text()}`)
    },
    { url: `${source}/v1/items/${itemId}/image`, base64 }
  )
}
