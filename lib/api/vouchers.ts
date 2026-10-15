import type { ApiClient } from "./http"
import { isProblem, ProblemCode } from "./problem"
import {
  ItemImageRules,
  query,
  type BaseUnit,
  type Item,
  type Page,
  type StockState,
} from "./stock"

/** Routes des bons et du stock (stock-api, StockApi). */
export const VoucherPaths = {
  vouchers: "/v1/vouchers",
  voucher: (id: string) => `/v1/vouchers/${id}`,
  transferReceipt: (id: string) => `/v1/vouchers/${id}/receipt`,
  photos: (id: string) => `/v1/vouchers/${id}/photos`,
  returnable: (id: string) => `/v1/vouchers/${id}/returnable`,
  stock: "/v1/stock",
  itemStock: (itemId: string) => `/v1/stock/items/${itemId}`,
} as const

export const VoucherQueryParams = {
  type: "type",
  warehouseId: "warehouseId",
  supplierId: "supplierId",
  customerId: "customerId",
  itemId: "itemId",
  categoryId: "categoryId",
  stockState: "stockState",
  from: "from",
  to: "to",
  order: "order",
  transferState: "transferState",
  discrepancy: "discrepancy",
  search: "q",
  page: "page",
  size: "size",
} as const

/** Mêmes limites que l'API (stock-api, StockLimits). */
export const VoucherLimits = {
  batch: 60,
  /** Nuance ou calibre d'un lot (stock-api, StockLimits.BATCH_TRAIT). */
  batchTrait: 20,
  counterparty: 120,
  documentReference: 60,
  note: 500,
  lines: 200,
} as const

/** Transfert (D27) : l'envoi sort le stock du départ, sa réception l'entre à l'arrivée. */
export const voucherTypes = [
  "RECEIPT",
  "ISSUE",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "DAMAGE",
  "ADJUSTMENT",
  "CUSTOMER_RETURN",
  "SUPPLIER_RETURN",
] as const
export type VoucherType = (typeof voucherTypes)[number]
export const VoucherType = {
  receipt: "RECEIPT",
  issue: "ISSUE",
  transferOut: "TRANSFER_OUT",
  transferIn: "TRANSFER_IN",
  damage: "DAMAGE",
  adjustment: "ADJUSTMENT",
  customerReturn: "CUSTOMER_RETURN",
  supplierReturn: "SUPPLIER_RETURN",
} as const satisfies Record<string, VoucherType>

/** Retour (D31) : le type du bon dont il peut partir (une sortie, une réception). */
export const returnOrigins = {
  [VoucherType.customerReturn]: VoucherType.issue,
  [VoucherType.supplierReturn]: VoucherType.receipt,
} as const satisfies Partial<Record<VoucherType, VoucherType>>
export type ReturnVoucherType = keyof typeof returnOrigins

/** Le retour qui part d'un bon de ce type, s'il y en a un. */
export function returnTypeOf(type: VoucherType): ReturnVoucherType | undefined {
  return (Object.keys(returnOrigins) as ReturnVoucherType[]).find(
    (candidate) => returnOrigins[candidate] === type
  )
}

/** Le tiers vient de l'annuaire des fournisseurs, ou de celui des clients (D30). */
export const supplierTypes: ReadonlySet<VoucherType> = new Set([
  VoucherType.receipt,
  VoucherType.supplierReturn,
])
export const customerTypes: ReadonlySet<VoucherType> = new Set([
  VoucherType.issue,
  VoucherType.customerReturn,
])

/** Casse et ajustement corrigent le stock : droit de correction, motif obligatoire (D28). */
export const correctionTypes: ReadonlySet<VoucherType> = new Set([
  VoucherType.damage,
  VoucherType.adjustment,
])

/** Motifs proposés pour chaque type (stock-api, VoucherReason) ; « autre » demande une note. */
export const voucherReasons = {
  [VoucherType.damage]: ["BROKEN", "DAMAGED", "EXPIRED", "LOST", "OTHER"],
  [VoucherType.adjustment]: ["COUNT", "ENTRY_ERROR", "OTHER"],
} as const
/** Clôture d'un inventaire (D32) : posé par l'API, jamais proposé à la saisie. */
export const INVENTORY_REASON = "INVENTORY"
export type VoucherReason =
  | (typeof voucherReasons)[typeof VoucherType.damage][number]
  | (typeof voucherReasons)[typeof VoucherType.adjustment][number]
  | typeof INVENTORY_REASON
export const OTHER_REASON = "OTHER" satisfies VoucherReason

/** Photos d'une casse (stock-api, StockLimits.PHOTOS_PER_VOUCHER). */
export const MAX_VOUCHER_PHOTOS = 5

/** Bons qui font entrer du stock dans leur dépôt ; un ajustement va dans les deux sens. */
export const incomingTypes: ReadonlySet<VoucherType> = new Set([
  VoucherType.receipt,
  VoucherType.transferIn,
  VoucherType.customerReturn,
])

/** Mouvement signé d'une ligne, en unité de base : l'ajustement va du théorique au compté. */
export function movementOf(
  type: VoucherType,
  line: Pick<VoucherLine, "quantity" | "expectedQuantity">
): number {
  if (type === VoucherType.adjustment)
    return line.quantity - (line.expectedQuantity ?? 0)
  return incomingTypes.has(type) ? line.quantity : -line.quantity
}

/** Bons saisis dans l'écran de saisie ; la réception d'un transfert part de l'envoi. */
export type EntryType = Exclude<VoucherType, typeof VoucherType.transferIn>

/** État d'un envoi de transfert, déduit de sa réception (stock-api, TransferState). */
export type TransferState = "IN_TRANSIT" | "RECEIVED"
export const TransferState = {
  inTransit: "IN_TRANSIT",
  received: "RECEIVED",
} as const satisfies Record<string, TransferState>

/** Bon lié : l'autre bon d'un transfert, le bon d'origine d'un retour, ou ses retours. */
export type VoucherRef = { id: string; number: string; occurredAt: string }

export type WarehouseRef = { id: string; name: string }

/** Ordre de la liste des bons, par date de l'opération (stock-api, VoucherOrder). */
export const voucherOrders = ["NEWEST_FIRST", "OLDEST_FIRST"] as const
export type VoucherOrder = (typeof voucherOrders)[number]
export const VoucherOrder = {
  newestFirst: "NEWEST_FIRST",
  oldestFirst: "OLDEST_FIRST",
} as const satisfies Record<string, VoucherOrder>

export type VoucherSummary = {
  id: string
  number: string
  type: VoucherType
  warehouse: WarehouseRef
  occurredAt: string
  supplierId: string | null
  customerId: string | null
  counterparty: string | null
  lineCount: number
  createdByName: string
  /** Envoi de transfert : dépôt d'arrivée et état. */
  destination: WarehouseRef | null
  transferState: TransferState | null
  reason: VoucherReason | null
  /** Une ligne reçue autrement qu'attendu (bon de livraison, transfert). */
  hasDiscrepancy: boolean
  /** Recherche par article : son mouvement net sur ce bon, en unité de base. */
  itemMovement: number | null
}

export type VoucherLine = {
  itemId: string
  itemName: string
  itemReference: string | null
  /** Lien signé vers la photo, relatif à l'API (voir useFileUrl) ; null sans photo. */
  itemImageUrl: string | null
  baseUnit: BaseUnit
  /** En unité de base. */
  quantity: number
  enteredQuantity: number
  packagingName: string | null
  batch: string | null
  /** Attendu : envoyé (transfert), annoncé (bon de livraison) ou théorique (ajustement). */
  expectedQuantity: number | null
  /** Caractéristiques du lot (D35). */
  shade: string | null
  caliber: string | null
}

export type Voucher = Omit<VoucherSummary, "lineCount"> & {
  documentReference: string | null
  note: string | null
  lines: VoucherLine[]
  recordedAt: string
  /** Réception de transfert : le dépôt de départ. */
  source: WarehouseRef | null
  /** Envoi : sa réception (null en transit). Réception : l'envoi qu'elle conclut. */
  receipt: VoucherRef | null
  transfer: VoucherRef | null
  /** Liens signés vers les photos (casse), relatifs à l'API (voir useFileUrl). */
  photoUrls: string[]
  customerId: string | null
  /** Retour : le bon dont il part. Sortie ou réception : les retours qui en partent (D31). */
  origin: VoucherRef | null
  returns: VoucherRef[]
  /** Ajustement de clôture : l'inventaire dont il porte les écarts (D32). */
  inventoryId: string | null
  /** Bon issu d'une demande (D33) : qui l'a préparé ; createdByName l'a validé. */
  preparedByName: string | null
}

export type VoucherLineInput = {
  itemId: string
  quantity: number
  /** Absent : quantité dans l'unité de base. */
  packagingName?: string
  batch?: string
  /** Réception : quantité annoncée par le bon de livraison, dans la même unité. */
  expectedQuantity?: number
  /** Réception d'un article suivi par lot : nuance et calibre du lot (D35). */
  shade?: string
  caliber?: string
}

export type VoucherInput = {
  type: VoucherType
  warehouseId: string
  /** Réception, retour fournisseur : fournisseur de l'annuaire ; son nom remplace counterparty. */
  supplierId?: string
  /** Sortie, retour client : client ou chantier de l'annuaire (D30). */
  customerId?: string
  /** Retour : le bon dont il part ; tiers et référence en sont repris (D31). */
  originVoucherId?: string
  occurredAt?: string
  counterparty?: string
  documentReference?: string
  note?: string
  /** Envoi de transfert : le dépôt d'arrivée. */
  destinationWarehouseId?: string
  /** Casse et ajustement : le motif. */
  reason?: VoucherReason
  lines: VoucherLineInput[]
}

/** Réception d'un transfert : quantité reçue de chaque ligne de l'envoi, dans l'ordre. */
export type TransferReceiptInput = {
  occurredAt?: string
  note?: string
  lines: { quantity: number }[]
}

/** Ce qui peut encore revenir d'une ligne du bon d'origine, en unité de base. */
export type ReturnableLine = {
  item: Item
  batch: string | null
  quantity: number
  returned: number
  remaining: number
}
export type Returnable = {
  origin: VoucherRef
  type: VoucherType
  /** Dépôt du bon d'origine, proposé pour le retour. */
  warehouse: WarehouseRef
  counterparty: string | null
  lines: ReturnableLine[]
}

/** Manque renvoyé par l'API quand une sortie dépasse le stock (champ « shortages »). */
export type Shortage = {
  itemId: string
  batch: string
  requested: number
  available: number
}

const SHORTAGES_FIELD = "shortages"

/** Manques d'une sortie refusée ; vide pour toute autre erreur. */
export function shortagesOf(error: unknown): Shortage[] {
  if (!isProblem(error, ProblemCode.insufficientStock)) return []
  const shortages = error.body[SHORTAGES_FIELD]
  return Array.isArray(shortages) ? (shortages as Shortage[]) : []
}

/** Stock d'un lot, avec sa nuance et son calibre (D35) pour choisir le bon. */
export type BatchQuantity = {
  batch: string | null
  quantity: number
  shade: string | null
  caliber: string | null
}
/** Dépôt où l'article est au seuil ou en dessous, ou en rupture. */
export type StockAlert = {
  warehouse: WarehouseRef
  state: StockState
  quantity: number
  minQuantity: number
}
export type StockRow = {
  item: Item
  quantity: number
  batches: BatchQuantity[]
  /** La plus grave des alertes ; OK sans alerte. */
  state: StockState
  /** Dans les dépôts filtrés, rupture d'abord. */
  alerts: StockAlert[]
}
export type WarehouseStock = {
  warehouse: WarehouseRef
  quantity: number
  batches: BatchQuantity[]
}
export type ItemStock = { itemId: string; warehouses: WarehouseStock[] }

/** [from] et [to] : jours inclus (AAAA-MM-JJ), comptés dans le fuseau des dépôts par l'API. */
export type VoucherSearch = {
  types?: VoucherType[]
  transferState?: TransferState
  /** Réceptions qui ne correspondent pas à l'attendu. */
  discrepancy?: boolean
  warehouseIds?: string[]
  supplierId?: string
  customerId?: string
  /** Bons qui portent cet article (historique de sa fiche). */
  itemId?: string
  from?: string
  to?: string
  order?: VoucherOrder
}
export type StockSearch = {
  text?: string
  warehouseIds?: string[]
  categoryId?: string
  stockStates?: StockState[]
}

export const voucherApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    vouchers: (search: VoucherSearch, page: number, size: number) =>
      send<Page<VoucherSummary>>({
        ...scoped,
        method: "GET",
        path:
          VoucherPaths.vouchers +
          query({
            [VoucherQueryParams.type]: search.types,
            [VoucherQueryParams.transferState]: search.transferState,
            [VoucherQueryParams.discrepancy]: search.discrepancy
              ? String(true)
              : undefined,
            [VoucherQueryParams.warehouseId]: search.warehouseIds,
            [VoucherQueryParams.supplierId]: search.supplierId,
            [VoucherQueryParams.customerId]: search.customerId,
            [VoucherQueryParams.itemId]: search.itemId,
            [VoucherQueryParams.from]: search.from,
            [VoucherQueryParams.to]: search.to,
            [VoucherQueryParams.order]: search.order,
            [VoucherQueryParams.page]: page,
            [VoucherQueryParams.size]: size,
          }),
      }),
    receiveTransfer: (
      transferId: string,
      id: string,
      input: TransferReceiptInput
    ) =>
      send<Voucher>({
        ...scoped,
        method: "POST",
        path: VoucherPaths.transferReceipt(transferId),
        body: { id, ...input },
      }),
    returnable: (id: string) =>
      send<Returnable>({
        ...scoped,
        method: "GET",
        path: VoucherPaths.returnable(id),
      }),
    addPhoto: (id: string, file: File) => {
      const body = new FormData()
      body.append(ItemImageRules.part, file)
      return send<Voucher>({
        ...scoped,
        method: "POST",
        path: VoucherPaths.photos(id),
        body,
      })
    },
    voucher: (id: string) =>
      send<Voucher>({
        ...scoped,
        method: "GET",
        path: VoucherPaths.voucher(id),
      }),
    record: (id: string, input: VoucherInput) =>
      send<Voucher>({
        ...scoped,
        method: "POST",
        path: VoucherPaths.vouchers,
        body: { id, ...input },
      }),
    stock: (search: StockSearch, page: number, size: number) =>
      send<Page<StockRow>>({
        ...scoped,
        method: "GET",
        path:
          VoucherPaths.stock +
          query({
            [VoucherQueryParams.search]: search.text,
            [VoucherQueryParams.warehouseId]: search.warehouseIds,
            [VoucherQueryParams.categoryId]: search.categoryId,
            [VoucherQueryParams.stockState]: search.stockStates,
            [VoucherQueryParams.page]: page,
            [VoucherQueryParams.size]: size,
          }),
      }),
    itemStock: (itemId: string) =>
      send<ItemStock>({
        ...scoped,
        method: "GET",
        path: VoucherPaths.itemStock(itemId),
      }),
  }
}
