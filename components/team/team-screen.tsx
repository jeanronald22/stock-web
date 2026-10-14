"use client"

import {
  BanIcon,
  EllipsisVerticalIcon,
  KeyRoundIcon,
  RotateCcwIcon,
  SendIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UserCheckIcon,
  XIcon,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ItemsTableSkeleton } from "@/components/items/items-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useWorkspace } from "@/components/workspace/workspace-context"
import {
  InvitationState,
  MembershipRole,
  MembershipStatus,
  type Invitation,
  type InvitationSent,
  type TeamMember,
} from "@/lib/api/platform"
import { GranteeKind, StockRole, type StockGrant } from "@/lib/api/stock"
import { useWarehouses } from "@/lib/api/stock-queries"
import {
  useChangeMemberRole,
  useChangeMemberStatus,
  useResendInvitation,
  useRevokeInvitation,
  useStockGrants,
  useTeam,
} from "@/lib/api/team-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"

import { AccessSheet } from "./access-sheet"
import { InvitationLink } from "./invitation-link"
import { InviteSheet } from "./invite-sheet"
import { NO_STOCK_ACCESS, type StockAccessValue } from "./stock-access-fields"

const SKELETON_ROWS = 4

function fullName(member: TeamMember): string {
  return (
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.email ||
    ""
  )
}

/**
 * Équipe de l'entreprise (DECISIONS.md, D25) : membres avec leur rôle dans l'équipe et dans Stock,
 * invitations en attente. Réservé au propriétaire et aux administrateurs.
 */
export function TeamScreen() {
  const t = useTranslations("team")
  const team = useTeam()
  const grants = useStockGrants()
  const [shared, setShared] = useState<InvitationSent | null>(null)
  const { organization } = useWorkspace()

  const grantOf = useMemo(() => {
    const byKey = new Map(
      (grants.data ?? []).map((grant) => [
        `${grant.kind}:${grant.granteeId}`,
        grant,
      ])
    )
    return (kind: GranteeKind, id: string) => byKey.get(`${kind}:${id}`)
  }, [grants.data])

  if (organization.role === MembershipRole.member) {
    return (
      <PageBody>
        <PageHeader title={t("title")} description={t("membersOnly")} />
      </PageBody>
    )
  }

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<InviteSheet />}
      />
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">{t("members")}</h2>
        <div className="overflow-hidden rounded-2xl border">
          {team.isPending ? (
            <ItemsTableSkeleton rows={SKELETON_ROWS} />
          ) : (
            <ul className="divide-y">
              {(team.data?.members ?? []).map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  grant={grantOf(GranteeKind.member, member.subject)}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      {(team.data?.invitations.length ?? 0) > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">{t("invitations")}</h2>
          <ul className="divide-y overflow-hidden rounded-2xl border">
            {team.data?.invitations.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                grant={grantOf(GranteeKind.invitation, invitation.id)}
                onShared={setShared}
              />
            ))}
          </ul>
        </section>
      )}

      <Sheet open={!!shared} onOpenChange={(open) => !open && setShared(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>{t("link.title")}</SheetTitle>
            <SheetDescription>
              {shared &&
                (shared.emailSent
                  ? t("invite.sent", { email: shared.invitation.email })
                  : t("invite.notSent", { email: shared.invitation.email }))}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {shared?.link && (
              <InvitationLink
                link={shared.link}
                organizationName={organization.name}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </PageBody>
  )
}

/** « Magasinier · Dépôt Bonabéri, Boutique Akwa », « Gérant · tous les dépôts », « Aucun accès ». */
function useAccessLabel() {
  const t = useTranslations("team.stockRoles")
  const warehouses = useWarehouses().data ?? []
  const names = new Map(
    warehouses.map((warehouse) => [warehouse.id, warehouse.name])
  )
  return (grant: StockGrant | undefined, owner = false): string => {
    if (owner)
      return `${t(`${StockRole.generalManager}.label`)} · ${t("ownerFixed")}`
    if (!grant) return t("NONE.label")
    if (grant.role === StockRole.generalManager)
      return `${t(`${grant.role}.label`)} · ${t("allWarehouses")}`
    const listed = grant.warehouseIds.map((id) => names.get(id)).filter(Boolean)
    return `${t(`${grant.role}.label`)} · ${listed.join(", ")}`
  }
}

function TeamRoleBadge({ role }: { role: MembershipRole }) {
  const t = useTranslations("team.role")
  const Icon =
    role === MembershipRole.member
      ? null
      : role === MembershipRole.owner
        ? ShieldCheckIcon
        : ShieldIcon
  return (
    <Badge
      variant={role === MembershipRole.member ? "outline" : "secondary"}
      className="gap-1"
    >
      {Icon && <Icon className="size-3" aria-hidden />}
      {t(`${role}.label`)}
    </Badge>
  )
}

function MemberRow({
  member,
  grant,
}: {
  member: TeamMember
  grant: StockGrant | undefined
}) {
  const t = useTranslations()
  const accessLabel = useAccessLabel()
  const errorMessage = useErrorMessage()
  const { organization } = useWorkspace()
  const changeRole = useChangeMemberRole()
  const changeStatus = useChangeMemberStatus()
  const [editingAccess, setEditingAccess] = useState(false)
  const name = fullName(member)
  const owner = member.role === MembershipRole.owner
  const disabled = member.status === MembershipStatus.disabled
  const actorIsOwner = organization.role === MembershipRole.owner
  // Un administrateur ne gère que les membres ; le propriétaire et soi-même sont protégés (D25).
  const manageable =
    !owner && (actorIsOwner || member.role === MembershipRole.member)
  const initial: StockAccessValue = grant
    ? { role: grant.role, warehouseIds: grant.warehouseIds }
    : NO_STOCK_ACCESS

  const onError = (error: unknown) => toast.error(errorMessage(error))

  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold"
        aria-hidden
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold">{name}</span>
          {member.self && (
            <span className="text-xs text-muted-foreground">
              ({t("team.you")})
            </span>
          )}
          <TeamRoleBadge role={member.role} />
          {disabled && <Badge variant="danger">{t("team.disabled")}</Badge>}
        </div>
        {member.email && (
          <p className="truncate text-sm text-muted-foreground">
            {member.email}
          </p>
        )}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {accessLabel(grant, owner)}
        </p>
      </div>
      {manageable && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("team.actions", { name })}
              />
            }
          >
            <EllipsisVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuItem onClick={() => setEditingAccess(true)}>
              <KeyRoundIcon />
              {t("team.access.edit")}
            </DropdownMenuItem>
            {actorIsOwner && (
              <DropdownMenuItem
                onClick={() =>
                  changeRole.mutate(
                    {
                      userId: member.userId,
                      role:
                        member.role === MembershipRole.admin
                          ? MembershipRole.member
                          : MembershipRole.admin,
                    },
                    { onError }
                  )
                }
              >
                <ShieldIcon />
                {member.role === MembershipRole.admin
                  ? t("team.role.demote")
                  : t("team.role.promote")}
              </DropdownMenuItem>
            )}
            {!member.self && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={disabled ? "default" : "destructive"}
                  onClick={() =>
                    changeStatus.mutate(
                      {
                        userId: member.userId,
                        status: disabled
                          ? MembershipStatus.active
                          : MembershipStatus.disabled,
                      },
                      {
                        onSuccess: () =>
                          toast.success(
                            disabled
                              ? t("team.enabled", { name })
                              : t("team.disabledDone", { name })
                          ),
                        onError,
                      }
                    )
                  }
                >
                  {disabled ? <UserCheckIcon /> : <BanIcon />}
                  {disabled ? t("team.enable") : t("team.disable")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {editingAccess && (
        <AccessSheet
          subject={member.subject}
          name={name}
          initial={initial}
          open={editingAccess}
          onOpenChange={setEditingAccess}
        />
      )}
    </li>
  )
}

function InvitationRow({
  invitation,
  grant,
  onShared,
}: {
  invitation: Invitation
  grant: StockGrant | undefined
  onShared: (sent: InvitationSent) => void
}) {
  const t = useTranslations()
  const format = useFormatter()
  const accessLabel = useAccessLabel()
  const errorMessage = useErrorMessage()
  const resend = useResendInvitation()
  const revoke = useRevokeInvitation()
  const expired = invitation.state === InvitationState.expired

  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold">{invitation.email}</span>
          <TeamRoleBadge role={invitation.role} />
          <Badge variant={expired ? "danger" : "info"}>
            {expired ? t("team.expired") : t("team.pending")}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {accessLabel(grant)} ·{" "}
          {t("team.expiresOn", {
            date: format.dateTime(new Date(invitation.expiresAt), {
              dateStyle: "medium",
            }),
          })}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("team.invitationActions", {
                email: invitation.email,
              })}
            />
          }
        >
          <EllipsisVerticalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            disabled={resend.isPending}
            onClick={() =>
              resend.mutate(invitation.id, {
                onSuccess: onShared,
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            {expired ? <RotateCcwIcon /> : <SendIcon />}
            {t("team.resend")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              revoke.mutate(invitation.id, {
                onSuccess: () =>
                  toast.success(t("team.revoked", { email: invitation.email })),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            <XIcon />
            {t("team.revoke")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
