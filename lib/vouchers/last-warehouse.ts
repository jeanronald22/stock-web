import { StorageKeys } from "@/lib/storage-keys"

/**
 * Dernier dépôt utilisé pour un bon, sur cet appareil. Simple confort : stockage illisible (navigation
 * privée) = aucun dépôt proposé d'office, sans autre conséquence.
 */
function key(subject: string, organizationId: string) {
  return `${StorageKeys.lastWarehousePrefix}${subject}.${organizationId}`
}

export function readLastWarehouse(subject: string | undefined, organizationId: string): string | null {
  if (!subject) return null
  try {
    return window.localStorage.getItem(key(subject, organizationId))
  } catch {
    return null
  }
}

export function rememberLastWarehouse(subject: string | undefined, organizationId: string, warehouseId: string) {
  if (!subject) return
  try {
    window.localStorage.setItem(key(subject, organizationId), warehouseId)
  } catch {
    // Stockage indisponible : le dépôt ne sera pas proposé d'office, rien de plus.
  }
}
