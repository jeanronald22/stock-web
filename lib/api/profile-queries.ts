"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApi } from "./api-provider"
import type { Me, User } from "./platform"
import { platformKeys } from "./platform-queries"
import { teamKeys } from "./team-queries"

/**
 * Changements du profil (D46) : la réponse remplace la personne dans « me ». La photo paraît aussi
 * dans l'équipe : sa liste est relue.
 */
function useProfileMutation<T>(action: (variables: T) => Promise<User>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: action,
    onSuccess: (user) => {
      queryClient.setQueryData<Me>(
        platformKeys.me,
        (me) => me && { ...me, user }
      )
      void queryClient.invalidateQueries({ queryKey: teamKeys.root })
    },
  })
}

export function useChangeLocale() {
  const { platform } = useApi()
  return useProfileMutation((locale: string) => platform.changeLocale(locale))
}

export function useUploadProfilePhoto() {
  const { platform } = useApi()
  return useProfileMutation((file: Blob) => platform.uploadPhoto(file))
}

export function useRemoveProfilePhoto() {
  const { platform } = useApi()
  return useProfileMutation(() => platform.removePhoto())
}
