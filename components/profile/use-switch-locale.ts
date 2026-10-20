"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type { AppLocale } from "@/i18n/locales"
import { useChangeLocale } from "@/lib/api/profile-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { rememberLocale } from "@/lib/locale-preference"

/**
 * Change la langue de l'application tout de suite, et l'enregistre au profil (D46) : les e-mails et
 * les avis partent ensuite dans cette langue. Le menu du compte et « Mon profil » s'en servent.
 */
export function useSwitchLocale() {
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const change = useChangeLocale()
  return (locale: AppLocale) => {
    rememberLocale(locale)
    router.refresh()
    change.mutate(locale, {
      onError: (error) => toast.error(errorMessage(error)),
    })
  }
}
