import { redirectToRecord } from "@/lib/records/legacy-record"
import { Routes } from "@/lib/routes"

export default function LegacyItemPage(props: PageProps<"/articles/[id]">) {
  return redirectToRecord(Routes.itemRecord, props)
}
