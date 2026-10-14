/**
 * Données de démonstration pour une entreprise existante, en local : dépôts, fournisseurs, articles,
 * réceptions et sorties, créés par l'API (numéros, niveaux de stock et registre restent cohérents).
 *
 * Connexion par la vraie page Keycloak ; identifiants passés par l'environnement, jamais écrits :
 *   SEED_EMAIL=… SEED_PASSWORD=… [SEED_ORGANIZATION="Vimelec"] npm run seed:demo
 *
 * Relançable sans doublon : chaque identifiant est dérivé de l'entreprise et d'une clé fixe, et
 * l'API traite un renvoi comme une création déjà faite.
 */
import { createHash } from "node:crypto"

import { chromium } from "@playwright/test"

const APP_URL = process.env.SEED_APP_URL ?? "http://localhost:3100"
const API_URL = process.env.SEED_API_URL ?? "http://localhost:8081"
const {
  SEED_EMAIL: email,
  SEED_PASSWORD: password,
  SEED_ORGANIZATION: organizationName,
} = process.env
if (!email || !password) {
  console.error("SEED_EMAIL et SEED_PASSWORD sont requis.")
  process.exit(1)
}

/** UUID version 5 (SHA-1) : le même pour une même entreprise et une même clé. */
function stableId(organizationId, key) {
  const bytes = createHash("sha1")
    .update(`${organizationId}:${key}`)
    .digest()
    .subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function daysAgo(days, hour = 10) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

const WAREHOUSES = [
  {
    key: "depot-bonaberi",
    name: "Dépôt Bonabéri",
    kind: "WAREHOUSE",
    city: "Douala",
    address: "Face au marché de Bonabéri",
  },
  {
    key: "boutique-akwa",
    name: "Boutique Akwa",
    kind: "SHOP",
    city: "Douala",
    address: "Boulevard de la Liberté, Akwa",
  },
  {
    key: "chantier-bonamoussadi",
    name: "Chantier Bonamoussadi",
    kind: "SITE",
    city: "Douala",
    address: "Lotissement Bonamoussadi",
  },
]

const SUPPLIERS = [
  {
    key: "cablerie",
    name: "Câblerie du Cameroun",
    phone: "+237 6 99 12 34 56",
    email: "commandes@cablerie.cm",
    address: "Zone industrielle de Bassa, Douala",
  },
  {
    key: "schneider",
    name: "Électro Distribution Douala",
    phone: "+237 6 77 45 67 89",
    email: "ventes@electrodistri.cm",
    address: "Rue Joss, Bonanjo",
  },
  {
    key: "centrale",
    name: "Quincaillerie Centrale Akwa",
    phone: "+237 6 55 98 76 54",
    address: "Rue Gallieni, Akwa",
  },
]

/** Familles d'articles ; parent : clé de la catégorie qui la contient. */
const CATEGORIES = [
  { key: "electricite", name: "Électricité" },
  { key: "cablage", name: "Câbles et gaines", parent: "electricite" },
  { key: "protection", name: "Protection", parent: "electricite" },
  { key: "appareillage", name: "Appareillage", parent: "electricite" },
  { key: "eclairage", name: "Éclairage" },
  { key: "peinture", name: "Peinture" },
]

/**
 * min : seuil d'alerte par dépôt, en unité de base. Choisis pour que la démo montre quelques
 * articles « stock bas » et une rupture après les bons ci-dessous.
 */
const ITEMS = [
  {
    key: "cable-25",
    category: "cablage",
    min: { "depot-bonaberi": 300, "boutique-akwa": 100 },
    name: "Câble rigide 2,5 mm² rouge",
    reference: "CAB-25-R",
    baseUnit: "METRE",
    packagings: [{ name: "Couronne", quantity: 100 }],
  },
  {
    key: "cable-15",
    category: "cablage",
    min: { "depot-bonaberi": 300, "boutique-akwa": 100 },
    name: "Câble rigide 1,5 mm² bleu",
    reference: "CAB-15-B",
    baseUnit: "METRE",
    packagings: [{ name: "Couronne", quantity: 100 }],
  },
  {
    key: "gaine-20",
    category: "cablage",
    min: { "depot-bonaberi": 100 },
    name: "Gaine ICTA 20 mm",
    reference: "GAI-20",
    baseUnit: "METRE",
    packagings: [{ name: "Couronne", quantity: 50 }],
  },
  {
    key: "disj-16",
    category: "protection",
    min: { "depot-bonaberi": 40, "boutique-akwa": 30 },
    name: "Disjoncteur 16 A",
    reference: "DIS-16",
    baseUnit: "PIECE",
    packagings: [{ name: "Boîte", quantity: 12 }],
  },
  {
    key: "disj-32",
    category: "protection",
    min: { "depot-bonaberi": 30 },
    name: "Disjoncteur 32 A",
    reference: "DIS-32",
    baseUnit: "PIECE",
    packagings: [{ name: "Boîte", quantity: 12 }],
  },
  {
    key: "prise",
    category: "appareillage",
    min: { "depot-bonaberi": 50, "boutique-akwa": 30 },
    name: "Prise murale 2P+T",
    reference: "PRI-2PT",
    baseUnit: "PIECE",
    packagings: [{ name: "Carton", quantity: 50 }],
  },
  {
    key: "interrupteur",
    category: "appareillage",
    min: { "depot-bonaberi": 0, "boutique-akwa": 30 },
    name: "Interrupteur simple allumage",
    reference: "INT-SA",
    baseUnit: "PIECE",
    packagings: [{ name: "Carton", quantity: 50 }],
  },
  {
    key: "ampoule",
    category: "eclairage",
    min: { "boutique-akwa": 100 },
    name: "Ampoule LED 9 W E27",
    reference: "LED-9W",
    baseUnit: "PIECE",
    packagings: [{ name: "Carton", quantity: 100 }],
  },
  {
    key: "reglette",
    category: "eclairage",
    min: { "boutique-akwa": 40 },
    name: "Réglette LED 120 cm",
    reference: "REG-120",
    baseUnit: "PIECE",
    packagings: [{ name: "Carton", quantity: 10 }],
  },
  {
    key: "tableau",
    category: "protection",
    min: { "depot-bonaberi": 12 },
    name: "Tableau électrique 2 rangées",
    reference: "TAB-2R",
    baseUnit: "PIECE",
    packagings: [],
  },
  {
    key: "boite-encastrement",
    category: "appareillage",
    min: { "boutique-akwa": 50 },
    name: "Boîte d’encastrement",
    reference: "BOI-ENC",
    baseUnit: "PIECE",
    packagings: [{ name: "Sachet", quantity: 25 }],
  },
  {
    key: "peinture",
    category: "peinture",
    min: { "depot-bonaberi": 60 },
    name: "Peinture isolante blanche",
    reference: "PEI-ISO",
    baseUnit: "LITRE",
    batchTracking: true,
    packagings: [{ name: "Seau", quantity: 20 }],
  },
]

/** Catalogue de chaque fournisseur : la première réception le complétera aussi. */
const CATALOGS = {
  cablerie: ["cable-25", "cable-15", "gaine-20"],
  schneider: ["disj-16", "disj-32", "tableau", "prise", "interrupteur"],
  centrale: ["ampoule", "reglette", "boite-encastrement", "peinture"],
}

/** Réceptions puis sorties : la quantité est dans l'unité indiquée (conditionnement ou base). */
const RECEIPTS = [
  {
    key: "rec-1",
    days: 13,
    warehouse: "depot-bonaberi",
    supplier: "cablerie",
    reference: "BL-2207",
    lines: [
      ["cable-25", 10, "Couronne"],
      ["cable-15", 8, "Couronne"],
      ["gaine-20", 6, "Couronne"],
    ],
  },
  {
    key: "rec-2",
    days: 12,
    warehouse: "depot-bonaberi",
    supplier: "schneider",
    reference: "BL-5541",
    lines: [
      ["disj-16", 6, "Boîte"],
      ["disj-32", 3, "Boîte"],
      ["tableau", 15],
      ["prise", 4, "Carton"],
    ],
  },
  {
    key: "rec-3",
    days: 10,
    warehouse: "boutique-akwa",
    supplier: "centrale",
    reference: "FAC-0912",
    lines: [
      ["ampoule", 3, "Carton"],
      ["reglette", 4, "Carton"],
      ["boite-encastrement", 10, "Sachet"],
    ],
  },
  {
    key: "rec-4",
    days: 9,
    warehouse: "boutique-akwa",
    supplier: "schneider",
    reference: "BL-5602",
    lines: [
      ["prise", 2, "Carton"],
      ["interrupteur", 2, "Carton"],
      ["disj-16", 2, "Boîte"],
    ],
  },
  {
    key: "rec-5",
    days: 7,
    warehouse: "depot-bonaberi",
    supplier: "centrale",
    reference: "FAC-0977",
    lines: [
      ["peinture", 5, "Seau", "LOT-0925"],
      ["peinture", 3, "Seau", "LOT-1003"],
    ],
  },
  {
    key: "rec-6",
    days: 5,
    warehouse: "boutique-akwa",
    supplier: "cablerie",
    reference: "BL-2251",
    lines: [
      ["cable-25", 3, "Couronne"],
      ["cable-15", 3, "Couronne"],
    ],
  },
  {
    key: "rec-7",
    days: 3,
    warehouse: "chantier-bonamoussadi",
    supplier: "cablerie",
    reference: "BL-2266",
    lines: [
      ["cable-25", 4, "Couronne"],
      ["gaine-20", 4, "Couronne"],
    ],
  },
]

const ISSUES = [
  {
    key: "sor-1",
    days: 11,
    warehouse: "depot-bonaberi",
    counterparty: "Chantier Logpom",
    lines: [
      ["cable-25", 250],
      ["gaine-20", 2, "Couronne"],
      ["disj-16", 10],
    ],
  },
  {
    key: "sor-2",
    days: 8,
    warehouse: "boutique-akwa",
    counterparty: "M. Ndongo",
    lines: [
      ["ampoule", 40],
      ["prise", 12],
      ["interrupteur", 10],
    ],
  },
  {
    key: "sor-3",
    days: 6,
    warehouse: "depot-bonaberi",
    counterparty: "Hôtel Akwa Palace",
    lines: [
      ["tableau", 4],
      ["disj-32", 8],
      ["cable-15", 300],
    ],
  },
  {
    key: "sor-4",
    days: 4,
    warehouse: "boutique-akwa",
    counterparty: "Vente comptoir",
    lines: [
      ["reglette", 6],
      ["boite-encastrement", 60],
      ["ampoule", 25],
    ],
  },
  {
    key: "sor-5",
    days: 2,
    warehouse: "depot-bonaberi",
    counterparty: "Chantier Bonapriso",
    lines: [
      ["peinture", 40, null, "LOT-0925"],
      ["disj-16", 12],
    ],
  },
  {
    key: "sor-6",
    days: 1,
    warehouse: "chantier-bonamoussadi",
    counterparty: "Équipe électricité, bâtiment B",
    lines: [
      ["cable-25", 180],
      ["gaine-20", 90],
    ],
  },
]

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ locale: "fr-FR" })
  await page.goto(`${APP_URL}/connexion`)
  await page.getByLabel("Adresse e-mail").fill(email)
  await page.getByLabel("Mot de passe", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Se connecter" }).click()
  // Retour dans l'application, ou message de Keycloak (identifiants refusés…) : on s'arrête avec lui.
  const signedIn = page.waitForURL(
    (url) =>
      url.origin === new URL(APP_URL).origin &&
      !url.pathname.startsWith("/auth"),
    { timeout: 30_000 }
  )
  // Messages de la page de connexion Keycloak (thème kreskala) ; l'application a ses propres alertes.
  const keycloakError = page.locator(".kk-alert, .kk-field-error").first()
  const refused = keycloakError.waitFor({ timeout: 30_000 })
  if (
    (await Promise.race([
      signedIn.then(() => "ok"),
      refused.then(() => "refused"),
    ])) === "refused"
  ) {
    throw new Error(
      `Connexion refusée par Keycloak : ${(await keycloakError.innerText()).trim()}`
    )
  }
  await page.waitForFunction(() =>
    Object.keys(localStorage).some((key) =>
      key.startsWith("kreskala.oidc.user")
    )
  )

  /** Appel à l'API avec la session de la page. */
  const call = (method, path, body, organizationId) =>
    page.evaluate(
      async ({ method, url, body, organizationId }) => {
        const user = Object.entries(localStorage).find(([key]) =>
          key.startsWith("kreskala.oidc.user")
        )?.[1]
        const { access_token: accessToken } = JSON.parse(user ?? "{}")
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...(organizationId ? { "X-Organization-Id": organizationId } : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        const text = await response.text()
        if (!response.ok)
          throw new Error(`${method} ${url} : ${response.status} ${text}`)
        return text ? JSON.parse(text) : null
      },
      { method, url: API_URL + path, body, organizationId }
    )

  const me = await call("GET", "/v1/me")
  const owned = me.organizations.filter(
    (organization) => organization.role === "OWNER"
  )
  const organization = organizationName
    ? owned.find(
        (candidate) =>
          candidate.name.toLowerCase() === organizationName.toLowerCase()
      )
    : owned[0]
  if (!organization)
    throw new Error(
      `Entreprise introuvable parmi : ${owned.map((o) => o.name).join(", ")}`
    )
  const org = organization.id
  const id = (key) => stableId(org, key)
  console.log(`Entreprise : ${organization.name} (${organization.city})`)

  // Un nom déjà pris (dépôt ou fournisseur créé à la main) n'empêche pas la suite.
  const create = async (path, body) => {
    try {
      await call("POST", path, body, org)
    } catch (error) {
      if (!String(error.message).includes("name-taken")) throw error
      console.log(`  déjà présent : ${body.name}`)
    }
  }

  for (const warehouse of WAREHOUSES) {
    const { key, ...fields } = warehouse
    await create("/v1/warehouses", { id: id(key), ...fields })
  }
  const warehouseIds = Object.fromEntries(
    (await call("GET", "/v1/warehouses", undefined, org)).map((warehouse) => [
      warehouse.name,
      warehouse.id,
    ])
  )
  const warehouseId = (key) =>
    warehouseIds[WAREHOUSES.find((warehouse) => warehouse.key === key).name]
  console.log(`Dépôts : ${WAREHOUSES.length}`)

  const categoryIds = {}

  // Parents d'abord (ordre de CATEGORIES) ; une catégorie créée à la main sous le même nom est reprise.
  for (const category of CATEGORIES) {
    const existing = await call("GET", "/v1/categories", undefined, org)
    const parentId = category.parent ? categoryIds[category.parent] : null
    const same = existing.find(
      (candidate) =>
        candidate.parentId === parentId &&
        candidate.name.toLowerCase() === category.name.toLowerCase()
    )
    categoryIds[category.key] =
      same?.id ??
      (
        await call(
          "POST",
          "/v1/categories",
          { id: id(`category-${category.key}`), name: category.name, parentId },
          org
        )
      ).id
  }
  console.log(`Catégories : ${CATEGORIES.length}`)

  for (const item of ITEMS) {
    const { key, category, min, ...fields } = item
    // Proposé dans les deux dépôts principaux ; les réceptions ajoutent les autres.
    const placements = ["depot-bonaberi", "boutique-akwa"].map((warehouse) => ({
      warehouseId: warehouseId(warehouse),
      minQuantity: min[warehouse] ?? null,
    }))
    const body = {
      batchTracking: false,
      ...fields,
      categoryId: categoryIds[category],
      warehouses: placements,
    }
    const saved = await call("POST", "/v1/items", { id: id(key), ...body }, org)
    // Article d'un passage précédent : catégorie et seuils sont remis, ses autres dépôts gardés.
    const placed = new Set(placements.map((placement) => placement.warehouseId))
    await call(
      "PUT",
      `/v1/items/${saved.id}`,
      {
        version: saved.version,
        ...body,
        warehouses: [
          ...placements,
          ...saved.warehouses.filter(
            (placement) => !placed.has(placement.warehouseId)
          ),
        ],
      },
      org
    )
  }
  console.log(`Articles : ${ITEMS.length}`)

  for (const supplier of SUPPLIERS) {
    const { key, ...fields } = supplier
    await create("/v1/suppliers", {
      id: id(key),
      ...fields,
      itemIds: CATALOGS[key].map(id),
    })
  }
  console.log(`Fournisseurs : ${SUPPLIERS.length}`)

  const toLines = (lines) =>
    lines.map(([item, quantity, packagingName, batch]) => ({
      itemId: id(item),
      quantity,
      ...(packagingName ? { packagingName } : {}),
      ...(batch ? { batch } : {}),
    }))
  for (const receipt of RECEIPTS) {
    await call(
      "POST",
      "/v1/vouchers",
      {
        id: id(receipt.key),
        type: "RECEIPT",
        warehouseId: warehouseId(receipt.warehouse),
        supplierId: id(receipt.supplier),
        occurredAt: daysAgo(receipt.days),
        documentReference: receipt.reference,
        lines: toLines(receipt.lines),
      },
      org
    )
  }
  for (const issue of ISSUES) {
    await call(
      "POST",
      "/v1/vouchers",
      {
        id: id(issue.key),
        type: "ISSUE",
        warehouseId: warehouseId(issue.warehouse),
        counterparty: issue.counterparty,
        occurredAt: daysAgo(issue.days, 15),
        lines: toLines(issue.lines),
      },
      org
    )
  }
  console.log(`Bons : ${RECEIPTS.length} réceptions, ${ISSUES.length} sorties`)
  console.log("Terminé.")
} finally {
  await browser.close()
}
