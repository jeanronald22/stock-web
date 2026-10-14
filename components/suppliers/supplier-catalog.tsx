"use client"

import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { ItemThumb } from "@/components/items/item-thumb"
import { Button } from "@/components/ui/button"
import { ItemPicker } from "@/components/vouchers/item-picker"
import type { Item } from "@/lib/api/stock"

/**
 * Catalogue d'un fournisseur : les articles qu'il livre, avec leur photo. Ajouter ou retirer passe
 * par [onAdd] et [onRemove] : enregistrement immédiat sur la fiche, liste locale dans l'assistant.
 */
export function SupplierCatalog({
  items,
  onAdd,
  onRemove,
  busy,
  readOnly,
}: {
  items: Item[]
  onAdd: (item: Item) => void
  onRemove: (item: Item) => void
  busy?: boolean
  /** Consultation seule : ni ajout ni retrait (rôle sans gestion du catalogue). */
  readOnly?: boolean
}) {
  const t = useTranslations("suppliers.catalog")
  return (
    <div className="space-y-4">
      {!readOnly && (
        <ItemPicker
          excludedIds={new Set(items.map((item) => item.id))}
          onPick={onAdd}
        />
      )}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <ItemThumb imageUrl={item.imageUrl} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.name}</span>
                {item.reference && (
                  <span className="block font-mono text-xs text-muted-foreground">
                    {item.reference}
                  </span>
                )}
              </span>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  aria-label={`${t("remove")} · ${item.name}`}
                  onClick={() => onRemove(item)}
                >
                  <XIcon />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
