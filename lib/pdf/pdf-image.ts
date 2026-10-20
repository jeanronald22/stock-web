/** Assez net à l'impression, sans alourdir un PDF de cinquante fiches. */
const MAX_SIDE = 1200
const JPEG_QUALITY = 0.85
const BACKGROUND = "#ffffff"
const JPEG = "image/jpeg"

/**
 * Photo prête pour un PDF, en JPEG (data URL) : react-pdf ne lit ni le WebP ni les grandes photos
 * sans peine ; elle est redessinée, réduite au passage. null si elle ne se charge pas : le document
 * part sans elle plutôt que d'échouer.
 */
export async function pdfImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const bitmap = await createImageBitmap(await response.blob())
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext("2d")
    if (!context) return null
    // Un PNG transparent deviendrait noir en JPEG.
    context.fillStyle = BACKGROUND
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return canvas.toDataURL(JPEG, JPEG_QUALITY)
  } catch {
    return null
  }
}
