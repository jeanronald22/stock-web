import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { WarehouseWizard } from "@/components/warehouses/warehouse-wizard"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("newWarehouse") }
}

export default function NewWarehousePage() {
  return <WarehouseWizard />
}
