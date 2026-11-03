"use client"

import { useEffect } from "react"
import {
  keepPreviousData,
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { markCatalogStale } from "@/lib/offline/offline-catalog"
import { useOfflineCatalog } from "@/lib/offline/use-offline-catalog"
import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import {
  CatalogStatus,
  nameKey,
  type CategoryInput,
  type ItemInput,
  type ItemSearch,
  type LocationInput,
  type WarehouseInput,
} from "./stock"

/**
 * Clés de cache préfixées par l'entreprise active : changer d'entreprise ne montre jamais, même
 * un instant, les articles de la précédente.
 */
export const stockKeys = {
  all: (organizationId: string | null) => ["stock", organizationId] as const,
  warehouses: (organizationId: string | null, status: CatalogStatus) =>
    [...stockKeys.all(organizationId), "warehouses", status] as const,
  transferDestinations: (organizationId: string | null) =>
    [...stockKeys.all(organizationId), "transfer-destinations"] as const,
  warehouse: (organizationId: string | null, id: string) =>
    [...stockKeys.all(organizationId), "warehouse", id] as const,
  items: (
    organizationId: string | null,
    search: ItemSearch,
    page: number,
    size: number
  ) => [...stockKeys.all(organizationId), "items", search, page, size] as const,
  itemCount: (organizationId: string | null) =>
    [...stockKeys.all(organizationId), "item-count"] as const,
  item: (organizationId: string | null, id: string) =>
    [...stockKeys.all(organizationId), "item", id] as const,
  sameName: (organizationId: string | null, name: string) =>
    [...stockKeys.all(organizationId), "same-name", name] as const,
  locations: (organizationId: string | null, warehouseId: string) =>
    [...stockKeys.all(organizationId), "locations", warehouseId] as const,
  categories: (organizationId: string | null) =>
    [...stockKeys.all(organizationId), "categories"] as const,
  myAccess: (organizationId: string | null) =>
    [...stockKeys.all(organizationId), "my-access"] as const,
}

function useOrganizationId() {
  return useActiveOrganization().activeOrganizationId
}

/**
 * Dépôts de l'entreprise. [fresh] : relus à chaque ouverture de l'écran, pour les assistants qui
 * choisissent un dépôt par défaut (un collègue vient peut-être d'en déclarer un).
 */
export function useWarehouses(
  status: CatalogStatus = CatalogStatus.active,
  { fresh = false }: { fresh?: boolean } = {}
) {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.warehouses(organizationId, status),
    queryFn: () => stock.warehouses(status),
    enabled: !!organizationId,
    refetchOnMount: fresh ? "always" : true,
  })
}

export function useTransferDestinations() {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.transferDestinations(organizationId),
    queryFn: stock.transferDestinations,
    enabled: !!organizationId,
    refetchOnMount: "always",
  })
}

export function useWarehouse(id: string) {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.warehouse(organizationId, id),
    queryFn: () => stock.warehouse(id),
    enabled: !!organizationId && !!id,
  })
}

/**
 * Une page d'articles. La page affichée reste visible pendant le chargement de la suivante, et la
 * page d'après est préchargée : « Suivant » s'affiche sans attente.
 */
export function useItemsPage(search: ItemSearch, page: number, size: number) {
  const { stock } = useApi()
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  const query = useQuery({
    queryKey: stockKeys.items(organizationId, search, page, size),
    queryFn: () => stock.items(search, page, size),
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
  })

  const hasNext = !!query.data && (page + 1) * size < query.data.total
  useEffect(() => {
    if (!hasNext || !organizationId) return
    void queryClient.prefetchQuery({
      queryKey: stockKeys.items(organizationId, search, page + 1, size),
      queryFn: () => stock.items(search, page + 1, size),
    })
  }, [hasNext, organizationId, queryClient, stock, search, page, size])

  return query
}

/** Nombre d'articles actifs, pour l'accueil : une seule ligne demandée. */
export function useItemCount() {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.itemCount(organizationId),
    queryFn: async () => (await stock.items({}, 0, 1)).total,
    enabled: !!organizationId,
  })
}

/** [id] absent : rien n'est chargé (article facultatif, comme un bon commencé sans article). */
export function useItem(id: string | undefined) {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  // Fiche jamais ouverte sur ce téléphone, sans réseau : la copie du catalogue la montre (D39).
  const copy = useOfflineCatalog()?.items.find((item) => item.id === id)
  return useQuery({
    queryKey: stockKeys.item(organizationId, id ?? ""),
    queryFn: () => stock.item(id!),
    enabled: !!organizationId && !!id,
    placeholderData: copy,
  })
}

/**
 * Étiquettes préremplies (D36) : les articles demandés, une étiquette chacun ; ou ceux d'un bon,
 * une étiquette par conditionnement saisi (25 cartons reçus, 25 étiquettes).
 */
export function useLabelSeed(itemIds: string[], voucherId: string | null) {
  const { stock, vouchers } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: [
      ...stockKeys.all(organizationId),
      "label-seed",
      itemIds,
      voucherId,
    ] as const,
    queryFn: async () => {
      const lines = voucherId
        ? (await vouchers.voucher(voucherId)).lines.map((line) => ({
            itemId: line.itemId,
            copies: Math.ceil(line.enteredQuantity),
          }))
        : itemIds.map((itemId) => ({ itemId, copies: 1 }))
      // Un article sur plusieurs lignes (plusieurs lots) : une seule ligne d'étiquettes.
      const copies = new Map<string, number>()
      lines.forEach((line) =>
        copies.set(line.itemId, (copies.get(line.itemId) ?? 0) + line.copies)
      )
      const items = await Promise.all(
        [...copies.keys()].map((id) => stock.item(id))
      )
      return items.map((item) => ({ item, copies: copies.get(item.id) ?? 1 }))
    },
    enabled: !!organizationId && (itemIds.length > 0 || !!voucherId),
    staleTime: Infinity,
  })
}

/**
 * Après une écriture qui touche au stock : listes, compteurs et fiches sont relus, et la copie du
 * catalogue gardée pour le hors ligne est refaite (D39), une réception pouvant placer un article
 * dans un nouveau dépôt.
 */
export function invalidateStock(
  queryClient: QueryClient,
  organizationId: string | null
): Promise<void> {
  if (organizationId) markCatalogStale(organizationId)
  return queryClient.invalidateQueries({
    queryKey: stockKeys.all(organizationId),
  })
}

/**
 * Après toute écriture, le catalogue de l'entreprise est relu : listes, compteurs et fiches restent
 * cohérents. [reload] : listes que l'écriture remplit, relues avant que la mutation ne rende la
 * main même si aucun écran ne les affiche. Sans cela, l'écran de liste où l'on revient après une
 * création montrerait sa copie d'avant (« Créez votre premier… ») le temps de la relire.
 */
function useStockMutation<Input, Output>(
  mutationFn: (input: Input) => Promise<Output>,
  reload?: (input: Input) => readonly string[]
) {
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn,
    onSuccess: async (_output, input) => {
      await invalidateStock(queryClient, organizationId)
      await Promise.all(
        (reload?.(input) ?? []).map((list) =>
          queryClient.refetchQueries({
            queryKey: [...stockKeys.all(organizationId), list],
            type: "inactive",
          })
        )
      )
    },
  })
}

export function useSaveWarehouse() {
  const { stock } = useApi()
  return useStockMutation(
    ({
      id,
      version,
      input,
    }: {
      id: string
      version?: number
      input: WarehouseInput
    }) =>
      version === undefined
        ? stock.createWarehouse(id, input)
        : stock.updateWarehouse(id, version, input),
    ({ version }) => (version === undefined ? ["warehouses"] : [])
  )
}

export function useWarehouseStatus() {
  const { stock } = useApi()
  return useStockMutation(
    ({ id, status }: { id: string; status: CatalogStatus }) =>
      status === CatalogStatus.archived
        ? stock.archiveWarehouse(id)
        : stock.restoreWarehouse(id)
  )
}

export function useSaveItem() {
  const { stock } = useApi()
  return useStockMutation(
    ({
      id,
      version,
      input,
      allowSameName,
    }: {
      id: string
      version?: number
      input: ItemInput
      /** Création : confirmée malgré un article actif du même nom (D50). */
      allowSameName?: boolean
    }) =>
      version === undefined
        ? stock.createItem(id, input, allowSameName)
        : stock.updateItem(id, version, input),
    ({ version }) => (version === undefined ? ["items", "item-count"] : [])
  )
}

export function useItemStatus() {
  const { stock } = useApi()
  return useStockMutation(
    ({ id, status }: { id: string; status: CatalogStatus }) =>
      status === CatalogStatus.archived
        ? stock.archiveItem(id)
        : stock.restoreItem(id)
  )
}

export function useUploadItemImage() {
  const { stock } = useApi()
  return useStockMutation(({ id, file }: { id: string; file: File }) =>
    stock.uploadItemImage(id, file)
  )
}

export function useRemoveItemImage() {
  const { stock } = useApi()
  return useStockMutation((id: string) => stock.removeItemImage(id))
}

/** Ajoute une photo ; [imageId], tiré une fois par fichier choisi, rend un renvoi sans effet. */
export function useAddItemImage() {
  const { stock } = useApi()
  return useStockMutation(
    ({ id, imageId, file }: { id: string; imageId: string; file: File }) =>
      stock.addItemImage(id, imageId, file)
  )
}

export function useRemoveItemImageEntry() {
  const { stock } = useApi()
  return useStockMutation(({ id, imageId }: { id: string; imageId: string }) =>
    stock.removeItemImageEntry(id, imageId)
  )
}

export function useMakeMainItemImage() {
  const { stock } = useApi()
  return useStockMutation(({ id, imageId }: { id: string; imageId: string }) =>
    stock.makeMainItemImage(id, imageId)
  )
}

/** Toutes les catégories, à plat (voir categoryTree) : quelques dizaines au plus. */
export function useCategories() {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.categories(organizationId),
    queryFn: () => stock.categories(),
    enabled: !!organizationId,
  })
}

export function useSaveCategory() {
  const { stock } = useApi()
  return useStockMutation(
    ({
      id,
      version,
      input,
    }: {
      id: string
      version?: number
      input: CategoryInput
    }) =>
      version === undefined
        ? stock.createCategory(id, input)
        : stock.updateCategory(id, version, input)
  )
}

export function useDeleteCategory() {
  const { stock } = useApi()
  return useStockMutation((id: string) => stock.deleteCategory(id))
}

/** Rôle Stock de la personne connectée : l'application montre seulement ce qu'il permet. */
export function useMyStockAccess() {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.myAccess(organizationId),
    queryFn: stock.myAccess,
    enabled: !!organizationId,
  })
}

/** Seuil d'alerte d'un dépôt, réglable aussi par un contrôleur. */
/** Emplacements d'un dépôt (D37), actifs et archivés, par code. */
export function useLocations(warehouseId: string | undefined) {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.locations(organizationId, warehouseId ?? ""),
    queryFn: () => stock.locations(warehouseId!),
    enabled: !!organizationId && !!warehouseId,
  })
}

export function useSaveLocation() {
  const { stock } = useApi()
  return useStockMutation(
    ({
      id,
      warehouseId,
      version,
      input,
    }: {
      id: string
      warehouseId: string
      version?: number
      input: LocationInput
    }) =>
      version === undefined
        ? stock.createLocation(id, warehouseId, input)
        : stock.updateLocation(id, version, input)
  )
}

export function useLocationStatus() {
  const { stock } = useApi()
  return useStockMutation(
    ({ id, status }: { id: string; status: CatalogStatus }) =>
      status === CatalogStatus.archived
        ? stock.archiveLocation(id)
        : stock.restoreLocation(id)
  )
}

export function useChangeItemLocation() {
  const { stock } = useApi()
  return useStockMutation(
    ({
      itemId,
      warehouseId,
      locationId,
    }: {
      itemId: string
      warehouseId: string
      locationId: string | null
    }) => stock.changeItemLocation(itemId, warehouseId, locationId)
  )
}

export function useAssignBarcodes() {
  const { stock } = useApi()
  return useStockMutation((itemIds: string[]) => stock.assignBarcodes(itemIds))
}

export function useChangeThreshold() {
  const { stock } = useApi()
  return useStockMutation(
    ({
      itemId,
      warehouseId,
      minQuantity,
      maxQuantity,
    }: {
      itemId: string
      warehouseId: string
      minQuantity: number | null
      maxQuantity: number | null
    }) => stock.changeThreshold(itemId, warehouseId, minQuantity, maxQuantity)
  )
}

/**
 * Article actif qui porte déjà ce nom (D50), pour prévenir avant d'en créer un second ; null s'il
 * n'y en a pas. [name] : déjà différé par l'appelant, pour ne pas interroger à chaque touche.
 */
export function useSameNameItem(name: string) {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  const key = nameKey(name)
  return useQuery({
    queryKey: stockKeys.sameName(organizationId, key),
    queryFn: async () =>
      (await stock.itemMatches([key], [])).names[0]?.item ?? null,
    enabled: !!organizationId && key.length > 0,
    staleTime: 30_000,
  })
}
