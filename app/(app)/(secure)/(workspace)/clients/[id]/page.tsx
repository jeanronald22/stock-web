import { redirectToRecord } from "@/lib/records/legacy-record"
import { Routes } from "@/lib/routes"

export default function LegacyCustomerPage(props: PageProps<"/clients/[id]">) {
  return redirectToRecord(Routes.customerRecord, props)
}
