import { expect, test, type Page } from "@playwright/test"

import {
  callApi,
  dismissTour,
  redirectApi,
  shot,
  signUpWithBusiness,
} from "./support"

test.beforeEach(async ({ context }) => redirectApi(context))

const year = new Date().getFullYear()

/** Le service worker a gardé l'application, et la copie du catalogue (D39) porte ce stock. */
async function waitForOfflineCopy(
  page: Page,
  itemId: string,
  quantity: number
) {
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect
    .poll(
      () =>
        page.evaluate(async (id) => {
          // Ouvrir une base absente la créerait vide : on attend que l'application l'ait créée.
          const databases = await indexedDB.databases()
          if (
            !databases.some((database) => database.name === "kreskala-catalog")
          )
            return 0
          return new Promise<number>((resolve) => {
            const open = indexedDB.open("kreskala-catalog")
            open.onerror = () => resolve(0)
            open.onsuccess = () => {
              const read = open.result
                .transaction("catalogs")
                .objectStore("catalogs")
                .getAll()
              read.onerror = () => resolve(0)
              read.onsuccess = () =>
                resolve(
                  (
                    read.result as {
                      stock?: Record<string, { quantity: number }[]>
                    }[]
                  )
                    .flatMap((catalog) => catalog.stock?.[id] ?? [])
                    .reduce((sum, warehouse) => sum + warehouse.quantity, 0)
                )
            }
          })
        }, itemId),
      { timeout: 30_000 }
    )
    .toBe(quantity)
}

/** L'application a écrit ses lectures sur le téléphone (droits de la personne compris). */
async function waitForPersistedReads(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            new Promise<boolean>((resolve) => {
              const open = indexedDB.open("kreskala-cache")
              open.onerror = () => resolve(false)
              open.onsuccess = () => {
                const read = open.result
                  .transaction("queries")
                  .objectStore("queries")
                  .get("query-client")
                read.onerror = () => resolve(false)
                read.onsuccess = () =>
                  resolve(
                    JSON.stringify(read.result ?? null).includes("my-access")
                  )
              }
            })
        ),
      { timeout: 15_000 }
    )
    .toBe(true)
}

test("hors ligne : la sortie est gardée sur le téléphone, envoyée au retour du réseau ; un refus se reprend", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await signUpWithBusiness(page, testInfo, "hors-ligne")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Magasin Akwa",
    kind: "SHOP",
  })
  const tile = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: tile,
    name: "Carreau 60x60",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: depot }],
  })
  await callApi(page, "POST", "/v1/vouchers", {
    id: crypto.randomUUID(),
    type: "RECEIPT",
    warehouseId: depot,
    lines: [{ itemId: tile, quantity: 100 }],
  })
  const quantity = page.getByRole("textbox", {
    name: "Quantité · Carreau 60x60",
  })
  const validate = page.getByRole("button", {
    name: "Valider la sortie · 1 article",
  })

  // Le réseau tombe pendant la saisie : la sortie reste sur le téléphone.
  await page.goto(`/bons/sortie?article=${tile}`)
  await expect(quantity).toBeVisible()
  await context.setOffline(true)
  await quantity.fill("12")
  await validate.click()
  await expect(page.getByText("Bon gardé sur ce téléphone")).toBeVisible()
  await expect(
    page.getByRole("status", { name: "Hors ligne · 1 à envoyer" })
  ).toBeVisible()
  await shot(page, testInfo, "01-garde-hors-ligne")

  // Le réseau revient : la sortie part toute seule.
  await context.setOffline(false)
  await expect(page.getByText(`Bon SOR-${year}-0001 envoyé.`)).toBeVisible()
  await expect(page.getByRole("status", { name: /à envoyer/ })).toHaveCount(0)

  // Une seconde sortie, impossible (plus que le stock) : elle partira aussi, et sera refusée.
  await page.goto(`/bons/sortie?article=${tile}`)
  await expect(quantity).toBeVisible()
  await context.setOffline(true)
  await quantity.fill("500")
  await validate.click()
  await expect(page.getByText("Bon gardé sur ce téléphone")).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByRole("status", { name: "1 à corriger" })).toBeVisible()

  // Dans « Bons », le motif ; « Reprendre » rouvre la saisie telle quelle.
  await page.getByRole("status", { name: "1 à corriger" }).click()
  await dismissTour(page, "Entrées et sorties")
  await expect(
    page.getByRole("heading", { name: "1 saisie sur ce téléphone" })
  ).toBeVisible()
  await expect(page.getByText(/pas assez de stock/)).toBeVisible()
  await shot(page, testInfo, "02-a-corriger")
  await page.getByRole("link", { name: "Reprendre" }).click()
  await expect(quantity).toHaveValue("500")
  await quantity.fill("50")
  await validate.click()
  await expect(
    page.getByRole("heading", { name: "1 saisie sur ce téléphone" })
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: new RegExp(`SOR-${year}-0002`) })
  ).toBeVisible()
})

test("hors ligne : une fiche jamais ouverte s'affiche avec son stock ; sinon l'écran le dit et elle arrive au retour du réseau", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await signUpWithBusiness(page, testInfo, "fiches-hors-ligne")
  await dismissTour(page, "Tout est ici")
  const depot = crypto.randomUUID()
  await callApi(page, "POST", "/v1/warehouses", {
    id: depot,
    name: "Magasin Akwa",
    kind: "SHOP",
  })
  const cement = crypto.randomUUID()
  await callApi(page, "POST", "/v1/items", {
    id: cement,
    name: "Ciment CPJ 35",
    baseUnit: "PIECE",
    warehouses: [{ warehouseId: depot }],
  })
  const receipt = crypto.randomUUID()
  await callApi(page, "POST", "/v1/vouchers", {
    id: receipt,
    type: "RECEIPT",
    warehouseId: depot,
    lines: [{ itemId: cement, quantity: 40 }],
  })
  // En ligne, seulement la liste des articles : ni la fiche, ni le bon.
  await page.goto("/articles")
  await dismissTour(page, "Votre catalogue")
  await expect(page.getByRole("link", { name: /Ciment CPJ 35/ })).toBeVisible()
  await waitForOfflineCopy(page, cement, 40)
  await waitForPersistedReads(page)

  await context.setOffline(true)
  await page
    .getByRole("link", { name: /Ciment CPJ 35/ })
    .first()
    .click()
  await expect(
    page.getByRole("heading", { name: "Ciment CPJ 35", level: 1 })
  ).toBeVisible()
  await expect(page.getByText("Magasin Akwa")).toBeVisible()
  await expect(page.getByText("40 pièces").first()).toBeVisible()
  await shot(page, testInfo, "01-fiche-hors-ligne")

  // Rechargée sans réseau : même fiche.
  await page.reload()
  await expect(page.getByText("40 pièces").first()).toBeVisible()

  // Un bon jamais ouvert ici : l'écran le dit, puis le montre au retour du réseau.
  await page.goto(`/bons/fiche?id=${receipt}`)
  await expect(
    page.getByRole("heading", { name: "Pas encore sur ce téléphone" })
  ).toBeVisible()
  await shot(page, testInfo, "02-bon-pas-encore-garde")
  await context.setOffline(false)
  await expect(
    page.getByRole("heading", { name: `REC-${year}-0001` })
  ).toBeVisible()

  // La racine redirige côté serveur : sans réseau, elle ouvre l'accueil.
  await context.setOffline(true)
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" })
  ).toBeVisible()
  await context.setOffline(false)
})

test("réseau muet et session expirée : l'application rouvre hors ligne au lieu de rester bloquée ; sans rien de gardé, elle le dit", async ({
  page,
  context,
  baseURL,
}, testInfo) => {
  test.slow()
  await signUpWithBusiness(page, testInfo, "reseau-muet")
  await dismissTour(page, "Tout est ici")
  await page.goto("/articles")
  await page.evaluate(() => navigator.serviceWorker.ready)
  await waitForPersistedReads(page)
  // Jeton expiré, comme après une nuit sans ouvrir l'application.
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith("kreskala.oidc.user:")) continue
      const user = JSON.parse(localStorage.getItem(key)!)
      user.expires_at = Math.floor(Date.now() / 1000) - 3600
      localStorage.setItem(key, JSON.stringify(user))
    }
  })
  await page.close()

  // Wi-fi sans internet : seule l'application répond (service worker), ni l'API ni la connexion.
  const origin = new URL(baseURL!).origin
  const muted = (url: URL) => url.origin !== origin
  await context.route(muted, (route) => route.abort("internetdisconnected"))
  const reopened = await context.newPage()
  await reopened.goto("/articles")
  await expect(
    reopened.getByRole("heading", { name: "Articles", level: 1 })
  ).toBeVisible()
  await expect(
    reopened.getByRole("status", { name: "Hors ligne" })
  ).toBeVisible()
  await shot(reopened, testInfo, "03-reseau-muet")
  await reopened.close()

  // Lectures du téléphone effacées : l'écran le dit, puis l'application reprend avec le réseau.
  const fresh = await context.newPage()
  await fresh.addInitScript(() => indexedDB.deleteDatabase("kreskala-cache"))
  await fresh.goto("/articles")
  await expect(
    fresh.getByRole("heading", { name: "Pas encore prêt sans réseau" })
  ).toBeVisible()
  await shot(fresh, testInfo, "04-pas-encore-pret")
  await context.unroute(muted)
  await expect(
    fresh.getByRole("heading", { name: "Articles", level: 1 })
  ).toBeVisible({ timeout: 30_000 })
})
