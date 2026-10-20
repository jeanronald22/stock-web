/** Assez net à l'impression, sans alourdir un PDF de cinquante fiches. */
const PHOTO_MAX_SIDE = 1200
/** Un logo s'imprime sur quelques centimètres : au-delà, le PDF grossit sans gain de netteté. */
const LOGO_MAX_SIDE = 800
const JPEG_QUALITY = 0.85
const BACKGROUND = "#ffffff"
const JPEG = "image/jpeg"
const PNG = "image/png"

/** Image prête pour un PDF, avec ses dimensions en pixels : de quoi la placer sans la déformer. */
export type PdfPicture = { src: string; width: number; height: number }

/**
 * Redessine l'image (react-pdf ne lit ni le WebP ni les grandes photos sans peine), réduite au
 * passage. null si elle ne se charge pas : le document part sans elle plutôt que d'échouer.
 */
async function redraw(
  url: string,
  maxSide: number,
  type: typeof JPEG | typeof PNG
): Promise<PdfPicture | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const bitmap = await createImageBitmap(await response.blob())
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext("2d")
    if (!context) return null
    // Un PNG transparent deviendrait noir en JPEG ; en PNG, la transparence reste.
    if (type === JPEG) {
      context.fillStyle = BACKGROUND
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return {
      src:
        type === JPEG
          ? canvas.toDataURL(JPEG, JPEG_QUALITY)
          : canvas.toDataURL(PNG),
      width: canvas.width,
      height: canvas.height,
    }
  } catch {
    return null
  }
}

/** Photo (article, casse) en JPEG (data URL). */
export async function pdfImage(url: string): Promise<string | null> {
  return (await redraw(url, PHOTO_MAX_SIDE, JPEG))?.src ?? null
}

/** Logo en PNG : les aplats et le texte restent nets, le fond transparent se fond dans la page. */
export function pdfLogo(url: string): Promise<PdfPicture | null> {
  return redraw(url, LOGO_MAX_SIDE, PNG)
}
