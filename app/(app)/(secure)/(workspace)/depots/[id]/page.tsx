import { redirectToRecord } from "@/lib/records/legacy-record"
import { Routes } from "@/lib/routes"

export default function LegacyWarehousePage(props: PageProps<"/depots/[id]">) {
  return redirectToRecord(Routes.warehouseRecord, props)
}
