"use client"

import { useSyncExternalStore } from "react"

import { isOnline, subscribeConnectivity } from "./connectivity"

/** true quand l'API est joignable ; au rendu serveur, on suppose le réseau là. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeConnectivity, isOnline, () => true)
}
