import { redirectToRecord } from "@/lib/records/legacy-record"
import { Routes } from "@/lib/routes"

export default function LegacyTransferReceiptPage(
  props: PageProps<"/bons/[id]/receptionner">
) {
  return redirectToRecord(Routes.transferReceipt, props)
}
