"use client"

import { ClipboardListIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { ChoiceCard } from "@/components/catalog/choice-card"
import { CategoryFilter } from "@/components/catalog/category-filter"
import { useCategoryTree } from "@/components/categories/use-category-tree"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useStartInventory } from "@/lib/api/inventory-queries"
import { CatalogStatus, StockPermission } from "@/lib/api/stock"
import { useWarehouses } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { RecordRoutes } from "@/lib/routes"

const Scope = { full: "full", cycle: "cycle" } as const
type Scope = (typeof Scope)[keyof typeof Scope]

/**
 * Ouvrir un inventaire (D32) : un dépôt, et tout le dépôt ou une catégorie (inventaire tournant).
 * Réservé au droit de correction ; la feuille s'ouvre aussitôt.
 */
export function StartInventorySheet() {
  const t = useTranslations("inventory.start")
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const { can, covers } = useStockAccess()
  // Liste relue : un collègue vient peut-être de déclarer un dépôt.
  const warehouses = (
    useWarehouses(CatalogStatus.active, { fresh: true }).data ?? []
  ).filter((warehouse) => covers(warehouse.id))
  const start = useStartInventory()
  // Inventaire tournant : par catégorie ; sans catégorie, il n'a pas de sens.
  const hasCategories = useCategoryTree().nodes.length > 0
  const [open, setOpen] = useState(false)
  const [warehouseId, setWarehouseId] = useState("")
  const [scope, setScope] = useState<Scope>(Scope.full)
  const [categoryId, setCategoryId] = useState<string | undefined>()
  // Un identifiant par ouverture : renvoyée après une coupure, elle n'ouvre pas deux inventaires.
  const [id, setId] = useState(() => crypto.randomUUID())
  if (!can(StockPermission.correctStock)) return null

  const chosenWarehouse =
    warehouseId || (warehouses.length === 1 ? warehouses[0].id : "")
  const ready =
    !!chosenWarehouse && (scope === Scope.full || categoryId !== undefined)

  const submit = () =>
    start.mutate(
      {
        id,
        warehouseId: chosenWarehouse,
        categoryId: scope === Scope.cycle ? categoryId : undefined,
      },
      {
        onSuccess: (inventory) => {
          setOpen(false)
          setId(crypto.randomUUID())
          router.push(RecordRoutes.inventory(inventory.id))
        },
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="lg" />}>
        <ClipboardListIcon />
        {t("open")}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          <Field>
            <FieldLabel htmlFor="inventory-warehouse">
              {t("warehouse")}
            </FieldLabel>
            <Select
              items={warehouses.map((warehouse) => ({
                value: warehouse.id,
                label: warehouse.name,
              }))}
              value={chosenWarehouse || null}
              onValueChange={(value) => setWarehouseId(value ?? "")}
            >
              <SelectTrigger id="inventory-warehouse" className="w-full">
                <SelectValue placeholder={t("chooseWarehouse")} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("scope")}</legend>
            <div
              role="radiogroup"
              aria-label={t("scope")}
              className="grid gap-2"
            >
              {[Scope.full, Scope.cycle].map((value) => (
                <ChoiceCard
                  key={value}
                  selected={scope === value}
                  label={t(`scopes.${value}.label`)}
                  hint={
                    value === Scope.cycle && !hasCategories
                      ? t("noCategory")
                      : t(`scopes.${value}.hint`)
                  }
                  disabled={value === Scope.cycle && !hasCategories}
                  onSelect={() => setScope(value)}
                />
              ))}
            </div>
            {scope === Scope.cycle && (
              <CategoryFilter
                value={categoryId}
                onChange={setCategoryId}
                className="mt-3 sm:w-full"
              />
            )}
          </fieldset>
        </div>
        <SheetFooter className="border-t">
          <Button
            size="lg"
            disabled={!ready || start.isPending}
            onClick={submit}
          >
            {start.isPending && <Spinner />}
            {t("submit")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
