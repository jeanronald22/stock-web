import { redirectToRecord } from "@/lib/records/legacy-record"
import { Routes } from "@/lib/routes"

export default function LegacySupplierPage(
  props: PageProps<"/fournisseurs/[id]">
) {
  return redirectToRecord(Routes.supplierRecord, props)
}
