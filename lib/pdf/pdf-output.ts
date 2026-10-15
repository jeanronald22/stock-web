/** Cadre caché de la dernière impression : remplacé à la suivante. */
let printFrame: HTMLIFrameElement | null = null

/** Enregistre le PDF sur l'appareil. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  // Le navigateur a lu le fichier : l'adresse temporaire peut être libérée.
  window.setTimeout(() => URL.revokeObjectURL(url))
}

/** Ouvre la boîte d'impression du navigateur sur le PDF, sans quitter la page. */
export function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  printFrame?.remove()
  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.tabIndex = -1
  Object.assign(frame.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  })
  frame.onload = () => {
    try {
      frame.contentWindow?.print()
    } catch {
      // Navigateur qui n'imprime pas un PDF dans un cadre : il s'ouvre dans un nouvel onglet.
      window.open(url, "_blank", "noopener")
    }
  }
  frame.src = url
  document.body.append(frame)
  printFrame = frame
}
