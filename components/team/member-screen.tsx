"use client"

import { BanIcon, ShieldCheckIcon, UserCheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { ArchiveControl } from "@/components/catalog/archive-control"
import { EmptyState } from "@/components/catalog/empty-state"
import { FormActions, FormSection } from "@/components/catalog/form-section"
import { SearchScene } from "@/components/illustrations/search-scene"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useWorkspace } from "@/components/workspace/workspace-context"
import {
  assignableRoles,
  MembershipRole,
  MembershipStatus,
  type AssignableRole,
  type TeamMember,
} from "@/lib/api/platform"
import { GranteeKind, type StockGrant } from "@/lib/api/stock"
import {
  useChangeMemberRole,
  useChangeMemberStatus,
  useGrantMember,
  useStockGrants,
  useTeam,
} from "@/lib/api/team-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { Routes } from "@/lib/routes"

import {
  AssignedWarehousesField,
  ChoiceCard,
  needsWarehouses,
  NO_STOCK_ROLE,
  StockRoleField,
  type StockRoleChoice,
} from "./stock-access-fields"
import { memberName } from "./team-format"

export function MemberScreen({ userId }: { userId: string }) {
  const t = useTranslations("team")
  const team = useTeam()
  const grants = useStockGrants()
  if (team.isPending || grants.isPending) {
    return (
      <PageBody>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-8 h-64 w-full rounded-2xl" />
      </PageBody>
    )
  }
  const member = team.data?.members.find(
    (candidate) => candidate.userId === userId
  )
  if (!member) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("memberNotFound.title")}
          description={t("memberNotFound.description")}
        />
      </PageBody>
    )
  }
  const grant = grants.data?.find(
    (candidate) =>
      candidate.kind === GranteeKind.member &&
      candidate.granteeId === member.subject
  )
  // Remonté à chaque changement enregistré : le formulaire repart des valeurs à jour.
  return (
    <MemberDetails
      key={`${member.role}:${grant?.role}:${grant?.warehouseIds.join()}`}
      member={member}
      grant={grant}
    />
  )
}

/**
 * Fiche d'un membre (DECISIONS.md, D25) : rôle dans l'équipe, accès Stock, désactivation. Le
 * propriétaire est gérant d'office ; un administrateur ne gère que les membres.
 */
function MemberDetails({
  member,
  grant,
}: {
  member: TeamMember
  grant: StockGrant | undefined
}) {
  const t = useTranslations()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const { organization } = useWorkspace()
  const changeRole = useChangeMemberRole()
  const changeStatus = useChangeMemberStatus()
  const grantMember = useGrantMember()
  const [role, setRole] = useState<AssignableRole>(
    member.role === MembershipRole.admin
      ? MembershipRole.admin
      : MembershipRole.member
  )
  const [stockRole, setStockRole] = useState<StockRoleChoice>(
    grant?.role ?? NO_STOCK_ROLE
  )
  const [warehouseIds, setWarehouseIds] = useState(grant?.warehouseIds ?? [])
  const [warehousesMissing, setWarehousesMissing] = useState(false)

  const name = memberName(member)
  const owner = member.role === MembershipRole.owner
  const actorIsOwner = organization.role === MembershipRole.owner
  const editable =
    !owner && (actorIsOwner || member.role === MembershipRole.member)
  const disabled = member.status === MembershipStatus.disabled
  const saving = changeRole.isPending || grantMember.isPending

  const save = async () => {
    if (needsWarehouses(stockRole) && warehouseIds.length === 0) {
      setWarehousesMissing(true)
      return
    }
    try {
      if (actorIsOwner && role !== member.role)
        await changeRole.mutateAsync({ userId: member.userId, role })
      await grantMember.mutateAsync({
        subject: member.subject,
        access:
          stockRole === NO_STOCK_ROLE
            ? null
            : {
                role: stockRole,
                warehouseIds: needsWarehouses(stockRole) ? warehouseIds : [],
              },
      })
      toast.success(t("team.access.saved", { name }))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const toggleStatus = () =>
    changeStatus.mutate(
      {
        userId: member.userId,
        status: disabled ? MembershipStatus.active : MembershipStatus.disabled,
      },
      {
        onSuccess: () =>
          toast.success(
            disabled
              ? t("team.enabled", { name })
              : t("team.disabledDone", { name })
          ),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  return (
    <PageBody>
      <PageHeader
        title={name}
        breadcrumbs={[
          { label: t("team.title"), href: Routes.team },
          { label: name },
        ]}
        description={member.email ?? undefined}
        className="mb-8"
        actions={
          <>
            {disabled && <Badge variant="danger">{t("team.disabled")}</Badge>}
            {editable && !member.self && (
              <ArchiveControl
                archived={disabled}
                pending={changeStatus.isPending}
                archiveLabels={{
                  action: t("team.disable"),
                  title: t("team.disableConfirm.title", { name }),
                  description: t("team.disableConfirm.description"),
                }}
                restoreLabel={t("team.enable")}
                onArchive={toggleStatus}
                onRestore={toggleStatus}
                archiveIcon={BanIcon}
                restoreIcon={UserCheckIcon}
              />
            )}
          </>
        }
      />

      {owner ? (
        <FormSection
          title={t("team.role.label")}
          description={t("team.ownerDescription")}
        >
          <p className="flex items-center gap-2 font-medium">
            <ShieldCheckIcon className="size-5 text-primary" aria-hidden />
            {t("team.role.OWNER.label")} ·{" "}
            {t("team.stockRoles.GENERAL_MANAGER.label")}
          </p>
        </FormSection>
      ) : (
        <>
          <FormSection
            title={t("team.role.label")}
            description={
              actorIsOwner
                ? t("team.role.description")
                : t("team.role.ownerOnly")
            }
          >
            <div
              role="radiogroup"
              aria-label={t("team.role.label")}
              className="grid gap-2 sm:grid-cols-2"
            >
              {assignableRoles.map((candidate) => (
                <ChoiceCard
                  key={candidate}
                  selected={role === candidate}
                  label={t(`team.role.${candidate}.label`)}
                  hint={t(`team.role.${candidate}.hint`)}
                  disabled={!actorIsOwner}
                  onSelect={() => setRole(candidate)}
                />
              ))}
            </div>
          </FormSection>
          <FormSection
            title={t("team.stockRoles.title")}
            description={t("team.access.description")}
          >
            <fieldset disabled={!editable} className="space-y-6">
              <StockRoleField value={stockRole} onChange={setStockRole} />
              {needsWarehouses(stockRole) && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    {t("team.stockRoles.warehouses")}
                  </p>
                  <AssignedWarehousesField
                    value={warehouseIds}
                    invalid={warehousesMissing}
                    onChange={(ids) => {
                      setWarehouseIds(ids)
                      setWarehousesMissing(false)
                    }}
                  />
                  {warehousesMissing && (
                    <FieldError
                      errors={[
                        { message: t("team.wizard.warehouses.required") },
                      ]}
                    />
                  )}
                </div>
              )}
            </fieldset>
          </FormSection>
          {editable && (
            <FormActions>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => router.push(Routes.team)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving && <Spinner />}
                {t("common.save")}
              </Button>
            </FormActions>
          )}
        </>
      )}
    </PageBody>
  )
}
