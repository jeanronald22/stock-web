"use client"

import { useLocale } from "next-intl"
import { useMemo } from "react"

import { useCategories } from "@/lib/api/stock-queries"
import { flattenCategories } from "@/lib/catalog/category-tree"

/** Catégories de l'entreprise, en arbre aplati, avec le chemin de chacune. */
export function useCategoryTree() {
  const categories = useCategories()
  const locale = useLocale()
  const nodes = useMemo(
    () => flattenCategories(categories.data ?? [], locale),
    [categories.data, locale]
  )
  const paths = useMemo(
    () => new Map(nodes.map((node) => [node.category.id, node.path])),
    [nodes]
  )
  return { nodes, paths, isSuccess: categories.isSuccess }
}
