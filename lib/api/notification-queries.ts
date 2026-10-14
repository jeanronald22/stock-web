"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import type { NotificationPreference } from "./notifications"

/** Relues toutes les minutes : un avis arrive sans recharger la page (DECISIONS.md, D26). */
const REFRESH_MS = 60_000

export const notificationKeys = {
  latest: (organizationId: string | null) =>
    ["notifications", organizationId] as const,
  preferences: ["notification-preferences"] as const,
}

export function useNotifications() {
  const { notifications } = useApi()
  const organizationId = useActiveOrganization().activeOrganizationId
  return useQuery({
    queryKey: notificationKeys.latest(organizationId),
    queryFn: notifications.latest,
    refetchInterval: REFRESH_MS,
  })
}

function useNotificationMutation<Input>(
  mutationFn: (input: Input) => Promise<void>
) {
  const queryClient = useQueryClient()
  const organizationId = useActiveOrganization().activeOrganizationId
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: notificationKeys.latest(organizationId),
      }),
  })
}

export function useMarkNotificationRead() {
  const { notifications } = useApi()
  return useNotificationMutation((id: string) => notifications.markRead(id))
}

export function useMarkAllNotificationsRead() {
  const { notifications } = useApi()
  return useNotificationMutation<void>(() => notifications.markAllRead())
}

export function useNotificationPreferences() {
  const { notifications } = useApi()
  return useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: notifications.preferences,
  })
}

export function useChangeNotificationPreference() {
  const { notifications } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (preference: NotificationPreference) =>
      notifications.changePreference(preference),
    onSuccess: (preferences) =>
      queryClient.setQueryData(notificationKeys.preferences, preferences),
  })
}
