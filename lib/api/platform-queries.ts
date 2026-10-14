"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "./api-provider"
import type { NewOrganization, ProfileInput } from "./platform"

export const platformKeys = {
  me: ["platform", "me"] as const,
}

export function useMe(options: { enabled?: boolean } = {}) {
  const { platform } = useApi()
  return useQuery({
    queryKey: platformKeys.me,
    queryFn: platform.me,
    enabled: options.enabled,
  })
}

export function useUpdateProfile() {
  const { platform } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfileInput) => platform.updateProfile(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformKeys.me }),
  })
}

export function useCreateOrganization() {
  const { platform } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewOrganization) => platform.createOrganization(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformKeys.me }),
  })
}
