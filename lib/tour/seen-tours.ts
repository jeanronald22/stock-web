import { StorageKeys } from "@/lib/storage-keys"

import type { TourId } from "./tours"

/**
 * Visites déjà vues sur cet appareil, par personne. Simple confort : stockage illisible (navigation
 * privée) = la visite se rouvre, sans autre conséquence.
 */
function key(subject: string) {
  return StorageKeys.toursSeenPrefix + subject
}

function read(subject: string): TourId[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(key(subject)) ?? "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function hasSeenTour(subject: string, tour: TourId): boolean {
  return read(subject).includes(tour)
}

export function markTourSeen(subject: string, tour: TourId) {
  try {
    const seen = new Set(read(subject)).add(tour)
    window.localStorage.setItem(key(subject), JSON.stringify([...seen]))
  } catch {
    // Stockage indisponible : la visite se rouvrira, rien de plus.
  }
}
