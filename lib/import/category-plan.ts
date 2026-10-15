import type { Category } from "@/lib/api/stock"

import { normalizeLabel } from "./import-fields"
import type { PreparedRow } from "./prepare-rows"

/** Catégorie à créer avant l'import ; son identifiant est choisi ici (création idempotente). */
export type PlannedCategory = {
  id: string
  name: string
  parentId: string | null
}

const ROOT = ""
const categoryKey = (parentId: string | null, name: string) =>
  `${parentId ?? ROOT}/${normalizeLabel(name)}`

/**
 * Catégories des lignes : retrouvées dans le catalogue (sans tenir compte des accents ni de la
 * casse), sinon prévues à la création, parents d'abord. Donne aussi la catégorie de chaque ligne.
 */
export function planCategories(rows: PreparedRow[], existing: Category[]) {
  const known = new Map(
    existing.map((category) => [
      categoryKey(category.parentId, category.name),
      category.id,
    ])
  )
  const created: PlannedCategory[] = []
  const byRow = new Map<PreparedRow, string | null>()
  rows.forEach((row) => {
    let parentId: string | null = null
    row.categoryPath.forEach((name) => {
      const key = categoryKey(parentId, name)
      let id = known.get(key)
      if (!id) {
        id = crypto.randomUUID()
        known.set(key, id)
        created.push({ id, name, parentId })
      }
      parentId = id
    })
    byRow.set(row, parentId)
  })
  return { created, byRow }
}
