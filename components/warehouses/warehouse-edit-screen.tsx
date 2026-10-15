"use client"

import { useTranslations } from "next-intl"

import {
  RecordNotFound,
  RecordSkeleton,
} from "@/components/records/record-states"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { ReadOnlyNotice } from "@/components/workspace/read-only-notice"
import { useStockAccess } from "@/components/workspace/stock-access"
import { StockPermission, type Warehouse } from "@/lib/api/stock"
import { useWarehouse } from "@/lib/api/stock-queries"
import { RecordRoutes, Routes } from "@/lib/routes"

import { WarehouseForm } from "./warehouse-form"

/** Modification d'un dépôt ; la consultation est WarehouseDetailScreen. */
export function WarehouseEditScreen({ id }: { id: string }) {
  const t = useTranslations("warehouses")
  const warehouse = useWarehouse(id)
  if (warehouse.isPending) return <RecordSkeleton />
  if (!warehouse.data)
    return (
      <RecordNotFound
        title={t("notFound")}
        listLabel={t("title")}
        listHref={Routes.warehouses}
      />
    )
  // La clé suit la version : après « Recharger », le formulaire repart de la fiche à jour.
  return (
    <WarehouseEdit
      key={warehouse.data.version}
      warehouse={warehouse.data}
      onReload={() => void warehouse.refetch()}
    />
  )
}

function WarehouseEdit({
  warehouse,
  onReload,
}: {
  warehouse: Warehouse
  onReload: () => void
}) {
  const t = useTranslations()
  const manages = useStockAccess().can(StockPermission.manageWarehouses)
  return (
    <PageBody>
      <PageHeader
        title={t("warehouses.detail.editTitle")}
        breadcrumbs={[
          { label: t("warehouses.title"), href: Routes.warehouses },
          { label: warehouse.name, href: RecordRoutes.warehouse(warehouse.id) },
          { label: t("records.edit") },
        ]}
        description={warehouse.name}
        className="mb-8"
      />
      {manages ? (
        <WarehouseForm warehouse={warehouse} onConflict={onReload} />
      ) : (
        <ReadOnlyNotice />
      )}
    </PageBody>
  )
}
