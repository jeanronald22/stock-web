import { redirect } from "next/navigation"

import { type AppRoute, RecordQueryParams } from "@/lib/routes"

type LegacyRecordProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Ancienne adresse d'une fiche (« /bons/<id> » : e-mails et notifications d'avant D39, favoris) :
 * renvoie vers sa page actuelle, les autres paramètres gardés (onglet ouvert).
 */
export async function redirectToRecord(
  route: AppRoute,
  { params, searchParams }: LegacyRecordProps
): Promise<never> {
  const { id } = await params
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams))
    for (const one of [value ?? []].flat()) query.append(key, one)
  query.set(RecordQueryParams.id, id)
  redirect(`${route}?${query}`)
}
