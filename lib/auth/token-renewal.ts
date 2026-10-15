"use client"

import { createContext, use } from "react"

/** Renouvelle le jeton d'accès s'il expire bientôt (voir cross-tab-renewal.ts). */
export const TokenRenewalContext = createContext<(() => Promise<void>) | null>(
  null
)

export function useTokenRenewal(): () => Promise<void> {
  const renew = use(TokenRenewalContext)
  if (!renew)
    throw new Error("useTokenRenewal doit être utilisé sous OidcProvider")
  return renew
}
