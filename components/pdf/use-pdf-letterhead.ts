"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useCallback } from "react"

import { useWorkspace } from "@/components/workspace/workspace-context"
import { useApi } from "@/lib/api/api-provider"
import type { Letterhead } from "@/lib/api/company"
import { companyKeys } from "@/lib/api/company-queries"
import { useFileUrl } from "@/lib/api/use-file-url"
import { formatPhone } from "@/lib/format"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { pdfLogo } from "@/lib/pdf/pdf-image"
import type { PdfFooter, PdfLetterhead } from "@/lib/pdf/pdf-letterhead"

const SEPARATOR = " · "

/**
 * En-tête et pied des documents PDF : l'entreprise active d'abord, son logo et ses coordonnées ;
 * Kreskala n'y figure qu'en mention. Hors connexion, l'en-tête se réduit au nom et à la ville connus
 * de l'espace de travail, plutôt que d'empêcher l'impression.
 */
export function usePdfLetterhead() {
  const t = useTranslations("pdf")
  const queryClient = useQueryClient()
  const { company } = useApi()
  const { activeOrganizationId } = useActiveOrganization()
  const { organization } = useWorkspace()
  const fileUrl = useFileUrl()

  const letterhead = useCallback(async (): Promise<PdfLetterhead> => {
    const known: Letterhead | null = await queryClient
      .fetchQuery({
        queryKey: companyKeys.letterhead(activeOrganizationId),
        queryFn: () => company.letterhead(),
      })
      .catch(() => null)
    const logoUrl = fileUrl(known?.logoUrl ?? organization.logoUrl)
    const logo = logoUrl ? await pdfLogo(logoUrl) : null
    if (!known)
      return { name: organization.name, logo, lines: [organization.city] }
    const ids = known.businessIds
      .map((id) => `${id.type} ${id.value}`)
      .join(SEPARATOR)
    return {
      name: known.name,
      logo,
      lines: [
        [known.address, known.city].filter(Boolean).join(SEPARATOR),
        known.phone
          ? t("phone", { phone: formatPhone(known.phone, known.phonePrefix) })
          : "",
        ids,
      ].filter(Boolean),
    }
  }, [queryClient, activeOrganizationId, company, organization, fileUrl, t])

  const footer = useCallback(
    (note: string): PdfFooter => ({ note, credit: t("credit") }),
    [t]
  )

  return { letterhead, footer }
}
