import type { Category } from "@/lib/api/stock"

/** Séparateur du chemin affiché : « Électricité › Câbles ». */
export const CATEGORY_PATH_SEPARATOR = " › "

export type CategoryNode = {
  category: Category
  /** 0 pour une catégorie racine. */
  depth: number
  path: string
  /** Descendantes à toute profondeur, la catégorie comprise. */
  subtreeIds: ReadonlySet<string>
}

/**
 * Arbre aplati dans l'ordre d'affichage (parent puis enfants, par nom à chaque niveau). Une
 * catégorie dont le parent manque (supprimé entre deux lectures) est rattachée à la racine.
 */
export function flattenCategories(
  categories: Category[],
  locale: string
): CategoryNode[] {
  const ids = new Set(categories.map((category) => category.id))
  const children = new Map<string | null, Category[]>()
  categories.forEach((category) => {
    const parent =
      category.parentId && ids.has(category.parentId) ? category.parentId : null
    children.set(parent, [...(children.get(parent) ?? []), category])
  })
  const byName = (a: Category, b: Category) =>
    a.name.localeCompare(b.name, locale, { sensitivity: "base" })

  const nodes: CategoryNode[] = []
  const visit = (parentId: string | null, depth: number, prefix: string) => {
    const subtree = new Set<string>()
    ;(children.get(parentId) ?? []).sort(byName).forEach((category) => {
      const path = prefix + category.name
      const node: CategoryNode = {
        category,
        depth,
        path,
        subtreeIds: new Set(),
      }
      nodes.push(node)
      const descendants = visit(
        category.id,
        depth + 1,
        path + CATEGORY_PATH_SEPARATOR
      )
      node.subtreeIds = new Set([category.id, ...descendants])
      node.subtreeIds.forEach((id) => subtree.add(id))
    })
    return subtree
  }
  visit(null, 0, "")
  return nodes
}
