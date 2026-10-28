import { redirectToRecord } from "@/lib/records/legacy-record"
import { Routes } from "@/lib/routes"

export default function LegacyVoucherPage(props: PageProps<"/bons/[id]">) {
  return redirectToRecord(Routes.voucherRecord, props)
}
