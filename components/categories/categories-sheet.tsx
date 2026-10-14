"use client"

import {
  CheckIcon,
  EllipsisVerticalIcon,
  FolderPlusIcon,
  FolderTreeIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { StockLimits } from "@/lib/api/stock"
import { useDeleteCategory, useSaveCategory } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import type { CategoryNode } from "@/lib/catalog/category-tree"

import { useCategoryTree } from "./use-category-tree"

/** Valeur « À la racine » du choix du parent : aucun identifiant ne peut la prendre. */
const ROOT = "root"

/**
 * Catégories d'articles, en arbre libre (« Électricité › Câbles ») : création, sous-catégories,
 * renommage, déplacement et suppression d'une catégorie vide, sans quitter la liste des articles.
 */
export function CategoriesSheet() {
  const t = useTranslations("categories")
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline" size="lg" />}
        data-testid="categories-open"
      >
        <FolderTreeIcon />
        {t("open")}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <CategoryManager />
      </SheetContent>
    </Sheet>
  )
}

function CategoryManager() {
  const t = useTranslations("categories")
  const { nodes, isSuccess } = useCategoryTree()
  const [parentId, setParentId] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const addChild = (id: string) => {
    setParentId(id)
    nameRef.current?.focus()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <NewCategoryForm
        nodes={nodes}
        parentId={parentId}
        onParentChange={setParentId}
        nameRef={nameRef}
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!isSuccess ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : nodes.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul aria-label={t("title")}>
            {nodes.map((node) =>
              editing === node.category.id ? (
                <EditCategoryRow
                  key={node.category.id}
                  node={node}
                  nodes={nodes}
                  onDone={() => setEditing(null)}
                />
              ) : (
                <CategoryRow
                  key={node.category.id}
                  node={node}
                  onEdit={() => setEditing(node.category.id)}
                  onAddChild={() => addChild(node.category.id)}
                />
              )
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

function NewCategoryForm({
  nodes,
  parentId,
  onParentChange,
  nameRef,
}: {
  nodes: CategoryNode[]
  parentId: string | null
  onParentChange: (id: string | null) => void
  nameRef: React.RefObject<HTMLInputElement | null>
}) {
  const t = useTranslations("categories")
  const errorMessage = useErrorMessage()
  const save = useSaveCategory()
  const [name, setName] = useState("")
  // Un identifiant par catégorie : un nouvel envoi après une coupure ne crée pas de doublon.
  const [id, setId] = useState(() => crypto.randomUUID())

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await save.mutateAsync({ id, input: { name: trimmed, parentId } })
      setName("")
      setId(crypto.randomUUID())
      nameRef.current?.focus()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="space-y-3 border-b p-4"
    >
      <div className="flex gap-2">
        <Input
          ref={nameRef}
          value={name}
          maxLength={StockLimits.name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("namePlaceholder")}
          aria-label={t("name")}
          className="h-11"
        />
        <Button
          type="submit"
          size="lg"
          className="h-11"
          disabled={!name.trim() || save.isPending}
        >
          {save.isPending ? <Spinner /> : <PlusIcon />}
          {t("add")}
        </Button>
      </div>
      <ParentSelect
        nodes={nodes}
        value={parentId}
        onChange={onParentChange}
        label={t("parent")}
      />
    </form>
  )
}

/** Parent d'une catégorie ; [excluded] : la catégorie déplacée et ses descendantes. */
function ParentSelect({
  nodes,
  value,
  onChange,
  label,
  excluded,
}: {
  nodes: CategoryNode[]
  value: string | null
  onChange: (id: string | null) => void
  label: string
  excluded?: ReadonlySet<string>
}) {
  const t = useTranslations("categories")
  const choices = nodes.filter((node) => !excluded?.has(node.category.id))
  const items = [
    { value: ROOT, label: t("root") },
    ...choices.map((node) => ({ value: node.category.id, label: node.path })),
  ]
  return (
    <Select
      items={items}
      value={value ?? ROOT}
      onValueChange={(next) => onChange(!next || next === ROOT ? null : next)}
    >
      <SelectTrigger className="w-full" size="sm" aria-label={label}>
        <span className="text-muted-foreground">{label}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function CategoryRow({
  node,
  onEdit,
  onAddChild,
}: {
  node: CategoryNode
  onEdit: () => void
  onAddChild: () => void
}) {
  const t = useTranslations("categories")
  const errorMessage = useErrorMessage()
  const remove = useDeleteCategory()
  const { category } = node

  const deleteCategory = async () => {
    try {
      await remove.mutateAsync(category.id)
      toast.success(t("deleted", { name: category.name }))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <li
      className="flex items-center gap-2 rounded-lg py-1.5 pr-1 hover:bg-muted/50"
      style={{ paddingInlineStart: `${0.75 + node.depth * 1.25}rem` }}
    >
      <span className="min-w-0 flex-1 truncate font-medium">
        {category.name}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {t("itemCount", { count: category.itemCount })}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("actions", { name: category.name })}
            />
          }
        >
          {remove.isPending ? <Spinner /> : <EllipsisVerticalIcon />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onAddChild}>
            <FolderPlusIcon />
            {t("addChild")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon />
            {t("edit")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void deleteCategory()}
          >
            <Trash2Icon />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

function EditCategoryRow({
  node,
  nodes,
  onDone,
}: {
  node: CategoryNode
  nodes: CategoryNode[]
  onDone: () => void
}) {
  const t = useTranslations("categories")
  const errorMessage = useErrorMessage()
  const save = useSaveCategory()
  const { category } = node
  const [name, setName] = useState(category.name)
  const [parentId, setParentId] = useState(category.parentId)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await save.mutateAsync({
        id: category.id,
        version: category.version,
        input: { name: trimmed, parentId },
      })
      onDone()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <li className="my-1 rounded-lg border bg-muted/30 p-2">
      <form onSubmit={(event) => void submit(event)} className="space-y-2">
        <div className="flex gap-1">
          <Input
            autoFocus
            value={name}
            maxLength={StockLimits.name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && onDone()}
            aria-label={t("name")}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!name.trim() || save.isPending}
            aria-label={t("save")}
          >
            {save.isPending ? <Spinner /> : <CheckIcon />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDone}
            aria-label={t("cancel")}
          >
            <XIcon />
          </Button>
        </div>
        <ParentSelect
          nodes={nodes}
          value={parentId}
          onChange={setParentId}
          label={t("moveTo")}
          excluded={node.subtreeIds}
        />
      </form>
    </li>
  )
}
