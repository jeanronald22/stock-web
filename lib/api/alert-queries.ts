"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import type { AlertSettings } from "./alerts"
import { useApi } from "./api-provider"
import { stockKeys } from "./stock-queries"

export const alertKeys = {
  settings: (organizationId: string | null) =>
    [...stockKeys.all(organizationId), "alert-settings"] as const,
}

/** [enabled] : lues seulement quand on ouvre leur réglage. */
export function useAlertSettings(enabled: boolean) {
  const { alerts } = useApi()
  const organizationId = useActiveOrganization().activeOrganizationId
  return useQuery({
    queryKey: alertKeys.settings(organizationId),
    queryFn: () => alerts.settings(),
    enabled: enabled && !!organizationId,
  })
}

export function useSaveAlertSettings() {
  const { alerts } = useApi()
  const queryClient = useQueryClient()
  const organizationId = useActiveOrganization().activeOrganizationId
  return useMutation({
    mutationFn: (settings: AlertSettings) => alerts.saveSettings(settings),
    onSuccess: (settings) =>
      queryClient.setQueryData(alertKeys.settings(organizationId), settings),
  })
}
