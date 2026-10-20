"use client"

import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompany } from "@/lib/api/company-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"

import { CompanyProfileForm } from "./company-profile-form"
import { KybDocuments } from "./kyb-documents"
import { KybLevelCard } from "./kyb-level-card"
import { SettingsLead } from "./settings-shell"

/**
 * Onglet « Entreprise » (D45) : le niveau de vérification et ce qui manque, la fiche, les pièces.
 * Réservé au propriétaire et aux administrateurs.
 */
export function CompanySettings() {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const company = useCompany()

  if (company.isError)
    return (
      <div
        role="alert"
        className="rounded-2xl bg-muted/40 px-6 py-10 text-center text-sm text-muted-foreground"
      >
        <p>{errorMessage(company.error)}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => company.refetch()}
        >
          {t("common.retry")}
        </Button>
      </div>
    )
  if (!company.data)
    return (
      <div className="space-y-4" aria-hidden>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )

  return (
    <>
      <SettingsLead>{t("settings.company.description")}</SettingsLead>
      <KybLevelCard company={company.data} />
      <CompanyProfileForm
        key={company.data.id}
        company={company.data}
        onConflict={async () => (await company.refetch()).data}
      />
      <KybDocuments company={company.data} />
    </>
  )
}
