"use client"

import {
  ChevronRightIcon,
  EllipsisVerticalIcon,
  RotateCcwIcon,
  SendIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/catalog/empty-state"
import { InvitationScene } from "@/components/illustrations/invitation-scene"
import { TeamScene } from "@/components/illustrations/team-scene"
import { ItemsTableSkeleton } from "@/components/items/items-table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  useResendInvitation,
  useRevokeInvitation,
  useStockGrants,
  useTeam,
} from "@/lib/api/team-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { RecordRoutes, Routes } from "@/lib/routes"

import { InvitationLink } from "./invitation-link"
import { memberName } from "./team-format"

const SKELETON_ROWS = 4

/**
 * Équipe de l'entreprise (DECISIONS.md, D25) : membres avec leur rôle dans l'équipe et dans Stock,
 * invitations en attente. Réservé au propriétaire et aux administrateurs.
 */
export function TeamScreen() {
  const t = useTranslations("team")
  const team = useTeam()
  const grants = useStockGrants()
  const { organization } = useWorkspace()
  const [shared, setShared] = useState<InvitationSent | null>(null)

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
        <PageHeader title={t("title")} />
        <EmptyState
          illustration={<TeamScene />}
          title={t("membersOnly.title")}
          description={t("membersOnly.description")}
        />
      </PageBody>
    )
  }

  const members = team.data?.members ?? []
  const invitations = team.data?.invitations ?? []
  // Seul le propriétaire, aucune invitation : l'écran vide porte l'action.
  const alone =
    team.isSuccess && members.length <= 1 && invitations.length === 0
  const inviteButton = (
    <Link
      href={Routes.newInvitation}
      className={buttonVariants({ size: "lg" })}
    >
      <UserPlusIcon />
      {t("invite.open")}
    </Link>
  )

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={alone ? undefined : inviteButton}
      />
      <>
        <div className="mt-8 overflow-hidden rounded-2xl border">
          {team.isPending ? (
            <ItemsTableSkeleton rows={SKELETON_ROWS} />
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">{t("table.person")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("table.role")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("table.stock")}
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <MemberRow
                    key={member.userId}
                    member={member}
                    grant={grantOf(GranteeKind.member, member.subject)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {alone && (
          <div className="mt-6 rounded-2xl border border-dashed">
            <EmptyState
              illustration={<TeamScene />}
              title={t("empty.title")}
              description={t("empty.description")}
              action={inviteButton}
            />
          </div>
        )}

        {invitations.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">{t("invitations")}</h2>
            <div className="overflow-hidden rounded-2xl border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">{t("table.email")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("table.stock")}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {t("table.expiry")}
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <InvitationRow
                      key={invitation.id}
                      invitation={invitation}
                      grant={grantOf(GranteeKind.invitation, invitation.id)}
                      onShared={setShared}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </>

      <Sheet open={!!shared} onOpenChange={(open) => !open && setShared(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{t("link.title")}</SheetTitle>
            <SheetDescription>
              {shared &&
                (shared.emailSent
                  ? t("invite.sent", { email: shared.invitation.email })
                  : t("invite.notSent", { email: shared.invitation.email }))}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 p-4">
            <InvitationScene className="mx-auto w-48" />
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

/** « Magasinier · Dépôt Bonabéri », « Gérant · tous les dépôts », « Aucun accès Stock ». */
function useAccessLabel() {
  const t = useTranslations("team.stockRoles")
  const warehouses = useWarehouses().data
  const names = useMemo(
    () =>
      new Map(
        (warehouses ?? []).map((warehouse) => [warehouse.id, warehouse.name])
      ),
    [warehouses]
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

export function TeamRoleBadge({ role }: { role: MembershipRole }) {
  const t = useTranslations("team.role")
  const Icon =
    role === MembershipRole.owner
      ? ShieldCheckIcon
      : role === MembershipRole.admin
        ? ShieldIcon
        : null
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

/** Toute la ligne ouvre la fiche du membre (le lien du nom couvre la ligne). */
function MemberRow({
  member,
  grant,
}: {
  member: TeamMember
  grant: StockGrant | undefined
}) {
  const t = useTranslations("team")
  const accessLabel = useAccessLabel()
  const name = memberName(member)
  const owner = member.role === MembershipRole.owner
  return (
    <TableRow className="relative cursor-pointer">
      <TableCell className="py-3 pl-4 whitespace-normal">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            aria-hidden
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={RecordRoutes.member(member.userId)}
                className="truncate font-semibold after:absolute after:inset-0 focus-visible:outline-none"
              >
                {name}
              </Link>
              {member.self && (
                <span className="text-xs text-muted-foreground">
                  ({t("you")})
                </span>
              )}
              {member.status === MembershipStatus.disabled && (
                <Badge variant="danger">{t("disabled")}</Badge>
              )}
            </div>
            {member.email && (
              <p className="truncate text-xs text-muted-foreground">
                {member.email}
              </p>
            )}
            {/* Petit écran : rôle et accès sous le nom, leurs colonnes étant masquées. */}
            <p className="truncate text-xs text-muted-foreground md:hidden">
              <span className="sm:hidden">
                {t(`role.${member.role}.label`)} ·{" "}
              </span>
              {accessLabel(grant, owner)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <TeamRoleBadge role={member.role} />
      </TableCell>
      <TableCell className="hidden text-sm md:table-cell">
        {accessLabel(grant, owner)}
      </TableCell>
      <TableCell className="pr-4 text-muted-foreground">
        <ChevronRightIcon className="size-4" aria-hidden />
      </TableCell>
    </TableRow>
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
  const t = useTranslations("team")
  const format = useFormatter()
  const accessLabel = useAccessLabel()
  const errorMessage = useErrorMessage()
  const resend = useResendInvitation()
  const revoke = useRevokeInvitation()
  const expired = invitation.state === InvitationState.expired
  const expiry = format.dateTime(new Date(invitation.expiresAt), {
    dateStyle: "medium",
  })

  return (
    <TableRow>
      <TableCell className="py-3 pl-4 whitespace-normal">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold">{invitation.email}</span>
          <TeamRoleBadge role={invitation.role} />
          <Badge variant={expired ? "danger" : "info"}>
            {expired ? t("expired") : t("pending")}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground md:hidden">
          {accessLabel(grant)}
          <span className="sm:hidden">
            {" "}
            · {t("expiresOn", { date: expiry })}
          </span>
        </p>
      </TableCell>
      <TableCell className="hidden text-sm md:table-cell">
        {accessLabel(grant)}
      </TableCell>
      <TableCell className="hidden text-sm sm:table-cell">{expiry}</TableCell>
      <TableCell className="pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("invitationActions", { email: invitation.email })}
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
              {t("resend")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                revoke.mutate(invitation.id, {
                  onSuccess: () =>
                    toast.success(t("revoked", { email: invitation.email })),
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              <XIcon />
              {t("revoke")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
