import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SupplierWizard } from "@/components/suppliers/supplier-wizard"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return { title: t("newSupplier") }
}

export default function NewSupplierPage() {
  return <SupplierWizard />
}
