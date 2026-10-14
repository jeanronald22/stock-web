/**
 * Visites guidées (driver.js) : quelques étapes par écran, l'essentiel seulement. Un élément
 * ciblé porte l'attribut data-tour (tourAnchor) ; une étape dont l'élément est absent est sautée.
 * Textes : messages « tours.<visite>.<étape>.title / .description ».
 */
export const TourAnchors = {
  navigation: "navigation",
  /** Bouton du menu, sur téléphone : le menu latéral y est fermé, donc absent de la page. */
  menuButton: "menu-button",
  organization: "organization",
  help: "help",
  nextSteps: "next-steps",
  newWarehouse: "new-warehouse",
  warehouseKind: "warehouse-kind",
  newItem: "new-item",
  itemSearch: "item-search",
  itemWarehouseFilter: "item-warehouse-filter",
  itemBaseUnit: "item-base-unit",
  itemPackagings: "item-packagings",
  itemWarehouses: "item-warehouses",
  newVoucher: "new-voucher",
  stockWarehouseFilter: "stock-warehouse-filter",
} as const
export type TourAnchor = (typeof TourAnchors)[keyof typeof TourAnchors]

export const TOUR_ATTRIBUTE = "data-tour"

/** Props à poser sur l'élément ciblé : <Button {...tourAnchor(TourAnchors.newItem)}>. */
export function tourAnchor(anchor: TourAnchor) {
  return { [TOUR_ATTRIBUTE]: anchor }
}

export function anchorSelector(anchor: TourAnchor): string {
  return `[${TOUR_ATTRIBUTE}="${anchor}"]`
}

export type TourStep = { anchor: TourAnchor; key: string }

export const tours = {
  // Même texte pour le menu (grand écran) et son bouton (téléphone) : un seul des deux est affiché.
  workspace: [
    { anchor: TourAnchors.navigation, key: "navigation" },
    { anchor: TourAnchors.menuButton, key: "navigation" },
    { anchor: TourAnchors.nextSteps, key: "nextSteps" },
    { anchor: TourAnchors.help, key: "help" },
  ],
  warehouses: [{ anchor: TourAnchors.newWarehouse, key: "create" }],
  warehouseForm: [{ anchor: TourAnchors.warehouseKind, key: "kind" }],
  items: [
    { anchor: TourAnchors.newItem, key: "create" },
    { anchor: TourAnchors.itemSearch, key: "search" },
    { anchor: TourAnchors.itemWarehouseFilter, key: "filter" },
  ],
  vouchers: [{ anchor: TourAnchors.newVoucher, key: "create" }],
  stock: [{ anchor: TourAnchors.stockWarehouseFilter, key: "filter" }],
  itemForm: [
    { anchor: TourAnchors.itemBaseUnit, key: "baseUnit" },
    { anchor: TourAnchors.itemPackagings, key: "packagings" },
    { anchor: TourAnchors.itemWarehouses, key: "warehouses" },
  ],
} as const satisfies Record<string, readonly TourStep[]>

export type TourId = keyof typeof tours

/** Clé de message d'une étape, exacte pour chaque visite (« items.search », jamais « items.baseUnit »). */
export type TourStepKey = {
  [Id in TourId]: `${Id}.${(typeof tours)[Id][number]["key"]}`
}[TourId]

export function tourStepKey<Id extends TourId>(
  tour: Id,
  step: (typeof tours)[Id][number]
): TourStepKey {
  return `${tour}.${step.key}` as TourStepKey
}
