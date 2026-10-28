import { redirectToRecord } from "@/lib/records/legacy-record"
import { Routes } from "@/lib/routes"

export default function LegacyRequestPage(
  props: PageProps<"/bons/demandes/[id]">
) {
  return redirectToRecord(Routes.requestRecord, props)
}
