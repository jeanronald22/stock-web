"use client"

import { useLocale } from "next-intl"
import { createContext, use, useMemo } from "react"
import { useAuth } from "react-oidc-context"

import { useRuntimeConfig } from "@/components/providers/runtime-config-provider"
import { useActiveOrganization } from "@/lib/organization/active-organization"

import { createApiClient, type ApiClient } from "./http"
import { notificationApi } from "./notifications"
import { platformApi } from "./platform"
import { stockApi } from "./stock"
import { supplierApi } from "./suppliers"
import { customerApi } from "./customers"
import { inventoryApi } from "./inventories"
import { reportApi } from "./reports"
import { requestApi } from "./voucher-requests"
import { voucherApi } from "./vouchers"

type Api = {
  platform: ReturnType<typeof platformApi>
  stock: ReturnType<typeof stockApi>
  vouchers: ReturnType<typeof voucherApi>
  suppliers: ReturnType<typeof supplierApi>
  customers: ReturnType<typeof customerApi>
  inventories: ReturnType<typeof inventoryApi>
  requests: ReturnType<typeof requestApi>
  reports: ReturnType<typeof reportApi>
  notifications: ReturnType<typeof notificationApi>
}

const ApiContext = createContext<Api | null>(null)

/** Le client est recréé quand le jeton, la langue ou l'entreprise active changent : c'est un simple objet. */
export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { apiUrl } = useRuntimeConfig()
  const token = useAuth().user?.access_token
  const locale = useLocale()
  const { activeOrganizationId } = useActiveOrganization()

  const api = useMemo<Api>(() => {
    const send: ApiClient = createApiClient({
      baseUrl: apiUrl,
      getAccessToken: () => token,
      getLocale: () => locale,
      getOrganizationId: () => activeOrganizationId,
    })
    return {
      platform: platformApi(send),
      stock: stockApi(send),
      vouchers: voucherApi(send),
      suppliers: supplierApi(send),
      customers: customerApi(send),
      inventories: inventoryApi(send),
      requests: requestApi(send),
      reports: reportApi(send),
      notifications: notificationApi(send),
    }
  }, [apiUrl, token, locale, activeOrganizationId])

  return <ApiContext value={api}>{children}</ApiContext>
}

export function useApi(): Api {
  const api = use(ApiContext)
  if (!api) throw new Error("useApi doit être utilisé sous ApiProvider")
  return api
}
