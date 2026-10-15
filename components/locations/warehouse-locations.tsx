"use client"

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  EllipsisVerticalIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useStockAccess } from "@/components/workspace/stock-access"
import {
  CatalogStatus,
  StockPermission,
  type Location,
  type Warehouse,
} from "@/lib/api/stock"
import { useLocations, useLocationStatus } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { cn } from "@/lib/utils"

import { LocationDialog } from "./location-dialog"

/** Emplacements montrés d'emblée ; les autres se déplient. */
const PREVIEW = 8

/**
 * Emplacements du dépôt (D37), sur sa fiche : allée, rayon, niveau, et combien d'articles y sont
 * rangés. Les archivés restent visibles à part, pour être restaurés.
 */
export function WarehouseLocations({ warehouse }: { warehouse: Warehouse }) {
  const t = useTranslations("locations")
  const errorMessage = useErrorMessage()
  const { can, covers } = useStockAccess()
  const editable =
    can(StockPermission.manageLocations) &&
    covers(warehouse.id) &&
    warehouse.status === CatalogStatus.active
  const locations = useLocations(warehouse.id)
  const status = useLocationStatus()
  const [editing, setEditing] = useState<Location | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const all = locations.data ?? []
  const active = all.filter(
    (location) => location.status === CatalogStatus.active
  )
  const archived = all.filter(
    (location) => location.status === CatalogStatus.archived
  )
  const shown = expanded ? [...active, ...archived] : active.slice(0, PREVIEW)
  const hidden = active.length + archived.length - shown.length

  const open = (location: Location | null) => {
    setEditing(location)
    setDialogOpen(true)
  }
  const changeStatus = (location: Location, target: CatalogStatus) =>
    status.mutate(
      { id: location.id, status: target },
      {
        onSuccess: () =>
          toast.success(
            target === CatalogStatus.archived
              ? t("archived", { code: location.code })
              : t("restored", { code: location.code })
          ),
        onError: (failure) => toast.error(errorMessage(failure)),
      }
    )

  return (
    <section aria-labelledby="warehouse-locations-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="warehouse-locations-title" className="text-lg font-semibold">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        {editable && all.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => open(null)}>
            <PlusIcon />
            {t("add")}
          </Button>
        )}
      </div>

      {locations.isPending ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : all.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-center">
          <MapPinIcon
            className="size-6 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <p className="flex-1 text-sm text-muted-foreground">{t("empty")}</p>
          {editable && (
            <Button variant="outline" onClick={() => open(null)}>
              <PlusIcon />
              {t("addFirst")}
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {shown.map((location) => {
            const isArchived = location.status === CatalogStatus.archived
            return (
              <li
                key={location.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  isArchived && "text-muted-foreground"
                )}
              >
                <span className="w-24 shrink-0 font-mono font-semibold">
                  {location.code}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {location.label}
                </span>
                {isArchived ? (
                  <Badge variant="secondary">{t("archivedBadge")}</Badge>
                ) : (
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {t("itemCount", { count: location.itemCount })}
                  </span>
                )}
                {editable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("actions", { code: location.code })}
                        />
                      }
                    >
                      <EllipsisVerticalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isArchived ? (
                        <DropdownMenuItem
                          onClick={() =>
                            changeStatus(location, CatalogStatus.active)
                          }
                        >
                          <ArchiveRestoreIcon />
                          {t("restore")}
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => open(location)}>
                            <PencilIcon />
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              changeStatus(location, CatalogStatus.archived)
                            }
                          >
                            <ArchiveIcon />
                            {t("archive")}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            )
          })}
          {(hidden > 0 || expanded) && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-primary hover:underline"
              >
                {expanded ? t("showLess") : t("showAll", { count: hidden })}
              </button>
            </li>
          )}
        </ul>
      )}
      {dialogOpen && (
        <LocationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          warehouseId={warehouse.id}
          location={editing}
        />
      )}
    </section>
  )
}
