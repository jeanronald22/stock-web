import { useTranslations } from "next-intl"

import { ItemImageRules } from "@/lib/api/stock"

const MEGABYTE = 1024 * 1024

/** Types acceptés, pour l'attribut accept d'un champ de fichier. */
export const IMAGE_ACCEPT = ItemImageRules.types.join(",")

/**
 * Vérifie une photo avant l'envoi : son message d'erreur, ou null si elle convient. L'API
 * revérifie le format réel et le poids.
 */
export function useImageCheck(): (file: File) => string | null {
  const t = useTranslations("images")
  return (file) => {
    if (!(ItemImageRules.types as readonly string[]).includes(file.type))
      return t("unsupported")
    if (file.size > ItemImageRules.maxBytes)
      return t("tooLarge", { max: ItemImageRules.maxBytes / MEGABYTE })
    return null
  }
}
