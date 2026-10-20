"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import type { Company, CompanyInput } from "./company"
import { platformKeys } from "./platform-queries"

export const companyKeys = {
  company: (organizationId: string | null) =>
    ["platform", "company", organizationId] as const,
  letterhead: (organizationId: string | null) =>
    ["platform", "company", organizationId, "letterhead"] as const,
}

export function useCompany() {
  const { company } = useApi()
  const organizationId = useActiveOrganization().activeOrganizationId
  return useQuery({
    queryKey: companyKeys.company(organizationId),
    queryFn: () => company.company(),
    enabled: !!organizationId,
  })
}

/**
 * Chaque changement renvoie la fiche à jour. Le nom, la ville et le niveau du KYB paraissent aussi
 * dans le sélecteur d'entreprise, et la fiche dans l'en-tête des documents : tous deux sont relus.
 */
function useCompanyMutation<T>(action: (variables: T) => Promise<Company>) {
  const queryClient = useQueryClient()
  const organizationId = useActiveOrganization().activeOrganizationId
  return useMutation({
    mutationFn: action,
    onSuccess: (company) => {
      queryClient.setQueryData(companyKeys.company(organizationId), company)
      void queryClient.invalidateQueries({ queryKey: platformKeys.me })
      void queryClient.invalidateQueries({
        queryKey: companyKeys.letterhead(organizationId),
      })
    },
  })
}

export function useUpdateCompany() {
  const { company } = useApi()
  return useCompanyMutation((input: CompanyInput) => company.update(input))
}

export function useUploadKybDocument() {
  const { company } = useApi()
  return useCompanyMutation(({ kind, file }: { kind: string; file: Blob }) =>
    company.upload(kind, file)
  )
}

export function useRemoveKybDocument() {
  const { company } = useApi()
  return useCompanyMutation((kind: string) => company.remove(kind))
}

/** Le logo paraît aussi dans le sélecteur d'entreprise : la liste du compte est relue. */
export function useUploadLogo() {
  const { company } = useApi()
  return useCompanyMutation((file: Blob) => company.uploadLogo(file))
}

export function useRemoveLogo() {
  const { company } = useApi()
  return useCompanyMutation(() => company.removeLogo())
}

export function useRequestVerification() {
  const { company } = useApi()
  return useCompanyMutation(() => company.requestVerification())
}
