"use client"

import { FolderTreeIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { useCategoryTree } from "@/components/categories/use-category-tree"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

/** Valeur « Toutes les catégories » : aucun identifiant ne peut la prendre. */
const ALL_CATEGORIES = "all"

/** Filtre par catégorie ; la catégorie choisie inclut ses sous-catégories. */
export function CategoryFilter({
  value,
  onChange,
  className,
}: {
  value: string | undefined
  onChange: (categoryId: string | undefined) => void
  className?: string
}) {
  const t = useTranslations("catalog")
  const { nodes } = useCategoryTree()
  // Pas de catégorie : le filtre n'aurait rien à proposer.
  if (nodes.length === 0 && !value) return null

  const items = [
    { value: ALL_CATEGORIES, label: t("allCategories") },
    ...nodes.map((node) => ({ value: node.category.id, label: node.path })),
  ]
  return (
    <Select
      items={items}
      value={value ?? ALL_CATEGORIES}
      onValueChange={(next) =>
        onChange(!next || next === ALL_CATEGORIES ? undefined : next)
      }
    >
      <SelectTrigger
        className={cn(
          "w-full sm:w-56",
          value && "border-primary/50 bg-primary/5",
          className
        )}
        aria-label={t("categoryFilter")}
      >
        <FolderTreeIcon className="size-5 text-muted-foreground" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_CATEGORIES}>{t("allCategories")}</SelectItem>
        {nodes.map((node) => (
          <SelectItem key={node.category.id} value={node.category.id}>
            <span style={{ paddingInlineStart: `${node.depth * 0.875}rem` }}>
              {node.category.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
