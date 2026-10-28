"use client"

import { useSearchParams } from "next/navigation"

import { RecordQueryParams } from "@/lib/routes"

/** Identifiant de la fiche ouverte, lu dans l'adresse (RecordRoutes) ; vide s'il manque. */
export function useRecordId(): string {
  return useSearchParams().get(RecordQueryParams.id) ?? ""
}
