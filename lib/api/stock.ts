import type { ApiClient } from "./http"

/** Routes du module Stock de l'API (stock-api, StockApi). */
export const StockPaths = {
  warehouses: "/v1/warehouses",
  warehouse: (id: string) => `/v1/warehouses/${id}`,
  warehouseArchive: (id: string) => `/v1/warehouses/${id}/archive`,
  warehouseRestore: (id: string) => `/v1/warehouses/${id}/restore`,
  transferDestinations: "/v1/warehouses/destinations",
  items: "/v1/items",
  item: (id: string) => `/v1/items/${id}`,
  itemArchive: (id: string) => `/v1/items/${id}/archive`,
  itemRestore: (id: string) => `/v1/items/${id}/restore`,
  itemImage: (id: string) => `/v1/items/${id}/image`,
  itemThreshold: (id: string, warehouseId: string) =>
    `/v1/items/${id}/warehouses/${warehouseId}/threshold`,
  /** Codes-barres internes pour les articles qui n'en ont pas (D36). */
  itemBarcodes: "/v1/items/barcodes",
  /** Import du catalogue par paquets, avec le stock de départ (D36). */
  itemImport: "/v1/items/import",
  myAccess: "/v1/stock/access/me",
  access: "/v1/stock/access",
  memberAccess: (subject: string) => `/v1/stock/access/members/${subject}`,
  invitationAccess: (invitationId: string) =>
    `/v1/stock/access/invitations/${invitationId}`,
  categories: "/v1/categories",
  category: (id: string) => `/v1/categories/${id}`,
} as const

/** Paramètres de recherche des listes (stock-api, StockApi et PageParams). */
export const StockQueryParams = {
  search: "q",
  status: "status",
  warehouseId: "warehouseId",
  supplierId: "supplierId",
  categoryId: "categoryId",
  stockState: "stockState",
  barcode: "barcode",
  page: "page",
  size: "size",
} as const

/** Code-barres valide : caractères imprimables sans espace, comme l'API (V21). */
export const BARCODE_PATTERN = /^[!-~]{1,64}$/

/** Mêmes limites que l'API (stock-api, StockLimits), pour signaler l'erreur avant l'envoi. */
export const StockLimits = {
  name: 120,
  reference: 40,
  /** Code-barres : caractères imprimables sans espace (stock-api, StockLimits.BARCODE_PATTERN). */
  barcode: 64,
  city: 80,
  address: 200,
  description: 500,
  packagingName: 40,
  packagingsPerItem: 10,
  batch: 60,
  pageSize: 50,
  /** Articles par paquet (import, codes-barres ; stock-api, StockLimits.ITEMS_PER_BATCH). */
  itemsPerBatch: 100,
} as const

export const catalogStatuses = ["ACTIVE", "ARCHIVED"] as const
export type CatalogStatus = (typeof catalogStatuses)[number]
export const CatalogStatus = {
  active: "ACTIVE",
  archived: "ARCHIVED",
} as const satisfies Record<string, CatalogStatus>

export const warehouseKinds = ["SHOP", "WAREHOUSE", "SITE"] as const
export type WarehouseKind = (typeof warehouseKinds)[number]

/** Unités de base ; PIECE se conditionne par nombres entiers (stock-api, BaseUnit). */
export const baseUnits = [
  "PIECE",
  "KILOGRAM",
  "LITRE",
  "METRE",
  "SQUARE_METRE",
  "CUBIC_METRE",
] as const
export type BaseUnit = (typeof baseUnits)[number]
export const wholeQuantityUnits: ReadonlySet<BaseUnit> = new Set(["PIECE"])

export type Warehouse = {
  id: string
  name: string
  kind: WarehouseKind
  city: string | null
  address: string | null
  status: CatalogStatus
  itemCount: number
  version: number
  createdAt: string
  updatedAt: string
}

export type WarehouseInput = {
  name: string
  kind: WarehouseKind
  city?: string
  address?: string
}

/** [defaultReceipt], [defaultIssue] : proposé d'office à la saisie des entrées, des sorties (D36). */
export type Packaging = {
  name: string
  quantity: number
  defaultReceipt: boolean
  defaultIssue: boolean
}

/**
 * Sens d'une saisie, pour le conditionnement proposé d'office (D36) : entrées (réception, retour
 * client), ou sorties et comptages (sortie, transfert, retour fournisseur, casse, ajustement, inventaire).
 */
export const EntryDirection = { receipt: "receipt", issue: "issue" } as const
export type EntryDirection =
  (typeof EntryDirection)[keyof typeof EntryDirection]

/** Le conditionnement proposé d'office dans ce sens ; undefined : l'unité de base. */
export function defaultPackaging(
  packagings: Packaging[],
  direction: EntryDirection
): Packaging | undefined {
  return packagings.find((packaging) =>
    direction === EntryDirection.receipt
      ? packaging.defaultReceipt
      : packaging.defaultIssue
  )
}

/**
 * État du stock d'un article dans un dépôt (stock-api, StockState). Seul un article dont le seuil
 * est renseigné est surveillé ; un seuil à 0 n'alerte qu'en rupture.
 */
export const stockStates = ["OK", "LOW", "OUT"] as const
export type StockState = (typeof stockStates)[number]
export const StockState = {
  ok: "OK",
  low: "LOW",
  out: "OUT",
} as const satisfies Record<string, StockState>

/** Dépôt où l'article est proposé, avec son seuil d'alerte en unité de base (null : aucun). */
export type ItemPlacement = { warehouseId: string; minQuantity: number | null }

export type Category = {
  id: string
  name: string
  parentId: string | null
  /** Articles actifs rangés directement dans la catégorie. */
  itemCount: number
  version: number
}

export type CategoryInput = { name: string; parentId: string | null }

/** Rôles Stock (stock-api, StockRole ; DECISIONS.md, D25) : seul le gérant a tous les dépôts. */
export const stockRoles = [
  "GENERAL_MANAGER",
  "MANAGER",
  "CONTROLLER",
  "STOREKEEPER",
] as const
export type StockRole = (typeof stockRoles)[number]
export const StockRole = {
  generalManager: "GENERAL_MANAGER",
  manager: "MANAGER",
  controller: "CONTROLLER",
  storekeeper: "STOREKEEPER",
} as const satisfies Record<string, StockRole>

export type StockPermission =
  | "VIEW"
  | "RECORD_MOVEMENTS"
  | "CORRECT_STOCK"
  | "SET_THRESHOLDS"
  | "MANAGE_CATALOG"
  | "MANAGE_WAREHOUSES"
export const StockPermission = {
  view: "VIEW",
  recordMovements: "RECORD_MOVEMENTS",
  correctStock: "CORRECT_STOCK",
  setThresholds: "SET_THRESHOLDS",
  manageCatalog: "MANAGE_CATALOG",
  manageWarehouses: "MANAGE_WAREHOUSES",
} as const satisfies Record<string, StockPermission>

/** Accès Stock de la personne connectée ; role null : aucun accès à Stock. */
export type MyStockAccess = {
  role: StockRole | null
  /** null : tous les dépôts. */
  warehouseIds: string[] | null
  permissions: StockPermission[]
  owner: boolean
}

export type GranteeKind = "MEMBER" | "INVITATION"
export const GranteeKind = {
  member: "MEMBER",
  invitation: "INVITATION",
} as const satisfies Record<string, GranteeKind>

export type StockGrant = {
  kind: GranteeKind
  granteeId: string
  role: StockRole
  warehouseIds: string[]
}

export type StockGrantInput = { role: StockRole; warehouseIds: string[] }

export type Item = {
  id: string
  name: string
  reference: string | null
  /** Code-barres (D34), scanné à la caméra ou à la douchette. */
  barcode: string | null
  baseUnit: BaseUnit
  batchTracking: boolean
  description: string | null
  packagings: Packaging[]
  warehouses: ItemPlacement[]
  categoryId: string | null
  status: CatalogStatus
  version: number
  createdAt: string
  updatedAt: string
  /** Lien signé vers la photo, relatif à l'API (voir useFileUrl) ; null sans photo. */
  imageUrl: string | null
}

export type ItemInput = {
  name: string
  reference?: string
  barcode?: string
  baseUnit: BaseUnit
  batchTracking: boolean
  description?: string
  packagings: Packaging[]
  warehouses: ItemPlacement[]
  categoryId: string | null
}

/**
 * Paquet d'import (D36) : articles à créer (identifiants choisis par l'application) et leur stock de
 * départ dans un dépôt, en unité de base. Renvoyé après une coupure, il ne crée rien deux fois.
 */
export type ImportBatch = {
  items: (ItemInput & { id: string })[]
  opening?: {
    voucherId: string
    warehouseId: string
    lines: { itemId: string; quantity: number; batch?: string }[]
  }
}

export const ImportOutcome = {
  created: "CREATED",
  alreadyCreated: "ALREADY_CREATED",
  rejected: "REJECTED",
} as const
export type ImportOutcome = (typeof ImportOutcome)[keyof typeof ImportOutcome]

/** [code] : motif d'un refus (code de problème de l'API) ; [openingCode] : stock de départ non posé. */
export type ImportResult = {
  items: { id: string; outcome: ImportOutcome; code: string | null }[]
  opening: { id: string; number: string } | null
  openingCode: string | null
}

/** Critères combinés en ET ; plusieurs dépôts ou états se combinent en OU entre eux. */
export type ItemSearch = {
  text?: string
  warehouseIds?: string[]
  status?: CatalogStatus
  /** Catégorie, sous-catégories comprises. */
  categoryId?: string
  /** Catalogue d'un fournisseur : seulement les articles qu'il livre. */
  supplierId?: string
  stockStates?: StockState[]
  /** Scan : le code-barres exact. */
  barcode?: string
}

/** Photos acceptées par l'API (stock-api, ImageFormat et ItemImageService). */
export const ItemImageRules = {
  types: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 5 * 1024 * 1024,
  /** Nom de la partie du formulaire multipart (stock-api, StockApi.IMAGE_PART). */
  part: "file",
} as const

export type Page<T> = { items: T[]; page: number; size: number; total: number }

export type QueryValue = string | number | readonly string[] | undefined

/** Paramètres d'adresse ; une liste est envoyée en répétant le paramètre (dépôts multiples). */
export function query(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((each) => search.append(key, each))
    else if (value !== undefined && value !== "") search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ""
}

/** Toutes les routes du stock concernent l'entreprise active. */
export const stockApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    warehouses: (status: CatalogStatus = CatalogStatus.active) =>
      send<Warehouse[]>({
        ...scoped,
        method: "GET",
        path:
          StockPaths.warehouses + query({ [StockQueryParams.status]: status }),
      }),
    /** Dépôts actifs vers lesquels envoyer un transfert, même hors des siens (D27). */
    transferDestinations: () =>
      send<{ id: string; name: string }[]>({
        ...scoped,
        method: "GET",
        path: StockPaths.transferDestinations,
      }),
    warehouse: (id: string) =>
      send<Warehouse>({
        ...scoped,
        method: "GET",
        path: StockPaths.warehouse(id),
      }),
    createWarehouse: (id: string, input: WarehouseInput) =>
      send<Warehouse>({
        ...scoped,
        method: "POST",
        path: StockPaths.warehouses,
        body: { id, ...input },
      }),
    updateWarehouse: (id: string, version: number, input: WarehouseInput) =>
      send<Warehouse>({
        ...scoped,
        method: "PUT",
        path: StockPaths.warehouse(id),
        body: { version, ...input },
      }),
    archiveWarehouse: (id: string) =>
      send<Warehouse>({
        ...scoped,
        method: "POST",
        path: StockPaths.warehouseArchive(id),
      }),
    restoreWarehouse: (id: string) =>
      send<Warehouse>({
        ...scoped,
        method: "POST",
        path: StockPaths.warehouseRestore(id),
      }),

    items: (
      search: ItemSearch,
      page: number,
      size: number = StockLimits.pageSize
    ) =>
      send<Page<Item>>({
        ...scoped,
        method: "GET",
        path:
          StockPaths.items +
          query({
            [StockQueryParams.search]: search.text,
            [StockQueryParams.warehouseId]: search.warehouseIds,
            [StockQueryParams.status]: search.status,
            [StockQueryParams.categoryId]: search.categoryId,
            [StockQueryParams.supplierId]: search.supplierId,
            [StockQueryParams.stockState]: search.stockStates,
            [StockQueryParams.barcode]: search.barcode,
            [StockQueryParams.page]: page,
            [StockQueryParams.size]: size,
          }),
      }),
    item: (id: string) =>
      send<Item>({ ...scoped, method: "GET", path: StockPaths.item(id) }),
    createItem: (id: string, input: ItemInput) =>
      send<Item>({
        ...scoped,
        method: "POST",
        path: StockPaths.items,
        body: { id, ...input },
      }),
    updateItem: (id: string, version: number, input: ItemInput) =>
      send<Item>({
        ...scoped,
        method: "PUT",
        path: StockPaths.item(id),
        body: { version, ...input },
      }),
    archiveItem: (id: string) =>
      send<Item>({
        ...scoped,
        method: "POST",
        path: StockPaths.itemArchive(id),
      }),
    restoreItem: (id: string) =>
      send<Item>({
        ...scoped,
        method: "POST",
        path: StockPaths.itemRestore(id),
      }),
    uploadItemImage: (id: string, file: File) => {
      const body = new FormData()
      body.append(ItemImageRules.part, file)
      return send<Item>({
        ...scoped,
        method: "PUT",
        path: StockPaths.itemImage(id),
        body,
      })
    },
    removeItemImage: (id: string) =>
      send<Item>({
        ...scoped,
        method: "DELETE",
        path: StockPaths.itemImage(id),
      }),

    /** Attribue un code interne aux articles qui n'en ont pas ; renvoie tous les articles demandés. */
    assignBarcodes: (itemIds: string[]) =>
      send<Item[]>({
        ...scoped,
        method: "POST",
        path: StockPaths.itemBarcodes,
        body: { itemIds },
      }),
    importItems: (batch: ImportBatch) =>
      send<ImportResult>({
        ...scoped,
        method: "POST",
        path: StockPaths.itemImport,
        body: batch,
      }),

    changeThreshold: (
      id: string,
      warehouseId: string,
      minQuantity: number | null
    ) =>
      send<Item>({
        ...scoped,
        method: "PUT",
        path: StockPaths.itemThreshold(id, warehouseId),
        body: { minQuantity },
      }),
    myAccess: () =>
      send<MyStockAccess>({
        ...scoped,
        method: "GET",
        path: StockPaths.myAccess,
      }),
    grants: () =>
      send<StockGrant[]>({ ...scoped, method: "GET", path: StockPaths.access }),
    grantMember: (subject: string, input: StockGrantInput) =>
      send<StockGrant>({
        ...scoped,
        method: "PUT",
        path: StockPaths.memberAccess(subject),
        body: input,
      }),
    revokeMember: (subject: string) =>
      send<void>({
        ...scoped,
        method: "DELETE",
        path: StockPaths.memberAccess(subject),
      }),
    grantInvitation: (invitationId: string, input: StockGrantInput) =>
      send<StockGrant>({
        ...scoped,
        method: "PUT",
        path: StockPaths.invitationAccess(invitationId),
        body: input,
      }),

    categories: () =>
      send<Category[]>({
        ...scoped,
        method: "GET",
        path: StockPaths.categories,
      }),
    createCategory: (id: string, input: CategoryInput) =>
      send<Category>({
        ...scoped,
        method: "POST",
        path: StockPaths.categories,
        body: { id, ...input },
      }),
    updateCategory: (id: string, version: number, input: CategoryInput) =>
      send<Category>({
        ...scoped,
        method: "PUT",
        path: StockPaths.category(id),
        body: { version, ...input },
      }),
    deleteCategory: (id: string) =>
      send<void>({
        ...scoped,
        method: "DELETE",
        path: StockPaths.category(id),
      }),
  }
}
