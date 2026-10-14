import { PrintParams, RecordRoutes } from "@/lib/routes"

/** Message de la page d'impression à la liste : l'impression est terminée, le cadre peut partir. */
export const PRINT_DONE_MESSAGE = "kreskala.voucher-printed"

/** Filet de sécurité : un cadre dont la page n'a jamais répondu est retiré au bout de ce délai. */
const FRAME_TIMEOUT_MS = 5 * 60_000
/** Taille d'une page A4 à 96 ppp : la mise en page du bon est celle de l'impression. */
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

/**
 * Imprime un bon sans quitter l'écran : sa page d'impression est chargée dans un cadre invisible,
 * qui ouvre lui-même la boîte d'impression du navigateur, puis est retiré.
 */
export function printVoucher(voucherId: string) {
  const frame = document.createElement("iframe")
  frame.src = `${RecordRoutes.voucherPrint(voucherId)}?${PrintParams.direct}`
  frame.setAttribute("aria-hidden", "true")
  frame.tabIndex = -1
  Object.assign(frame.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${A4_WIDTH_PX}px`,
    height: `${A4_HEIGHT_PX}px`,
    border: "0",
  })

  const remove = () => {
    window.removeEventListener("message", onMessage)
    window.clearTimeout(timeout)
    frame.remove()
  }
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (event.data?.type === PRINT_DONE_MESSAGE && event.data?.id === voucherId)
      remove()
  }
  window.addEventListener("message", onMessage)
  const timeout = window.setTimeout(remove, FRAME_TIMEOUT_MS)
  document.body.append(frame)
}
