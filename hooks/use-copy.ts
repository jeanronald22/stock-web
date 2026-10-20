import { useCallback, useEffect, useRef, useState } from "react"

/** Durée de la coche après une copie réussie. */
const COPIED_FEEDBACK_MS = 2000

/**
 * Copie dans le presse-papiers : [copied] reste vrai un instant (la coche remplace l'icône).
 * Un échec (navigateur qui refuse) est rendu à l'appelant, qui dit quoi faire à la main.
 */
export function useCopy(onFailure: () => void) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(
          () => setCopied(false),
          COPIED_FEEDBACK_MS
        )
      } catch {
        onFailure()
      }
    },
    [onFailure]
  )
  return { copied, copy }
}
