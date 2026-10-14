"use client"

import { MailIcon, SendIcon, UserPlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspace } from "@/components/workspace/workspace-context"
import {
  FieldLimits,
  MembershipRole,
  assignableRoles,
  type AssignableRole,
  type InvitationSent,
} from "@/lib/api/platform"
import { isProblem, ProblemCode } from "@/lib/api/problem"
import { useInvite } from "@/lib/api/team-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { cn } from "@/lib/utils"

import { InvitationLink } from "./invitation-link"
import {
  isAccessComplete,
  NO_STOCK_ACCESS,
  StockAccessFields,
  type StockAccessValue,
} from "./stock-access-fields"

/** Adresse plausible ; l'API vérifie de son côté, et seule la personne invitée prouvera la sienne. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Invitation d'une personne : adresse, rôle dans l'équipe, accès Stock, puis lien à partager. */
export function InviteSheet() {
  const t = useTranslations("team.invite")
  const [open, setOpen] = useState(false)
  // Un nouveau formulaire à chaque ouverture : identifiant d'invitation neuf, champs vides.
  const [session, setSession] = useState(0)
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setSession((value) => value + 1)
      }}
    >
      <SheetTrigger render={<Button size="lg" />}>
        <UserPlusIcon />
        {t("open")}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <InviteForm key={session} onDone={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const { organization } = useWorkspace()
  const invite = useInvite()
  const [id] = useState(() => crypto.randomUUID())
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [role, setRole] = useState<AssignableRole>(MembershipRole.member)
  const [access, setAccess] = useState<StockAccessValue>(NO_STOCK_ACCESS)
  const [sent, setSent] = useState<InvitationSent | null>(null)
  // Seul le propriétaire nomme un administrateur (D25).
  const roles =
    organization.role === MembershipRole.owner
      ? assignableRoles
      : [MembershipRole.member]

  if (sent) {
    return (
      <div className="space-y-4 p-4">
        <p className="flex items-start gap-2 text-sm">
          <MailIcon
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden
          />
          {sent.emailSent
            ? t("team.invite.sent", { email: sent.invitation.email })
            : t("team.invite.notSent", { email: sent.invitation.email })}
        </p>
        {sent.link && (
          <InvitationLink
            link={sent.link}
            organizationName={organization.name}
          />
        )}
        <Button className="w-full" variant="outline" size="lg" onClick={onDone}>
          {t("common.close")}
        </Button>
      </div>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL.test(trimmed)) {
      setEmailError(t("validation.email"))
      return
    }
    try {
      setSent(
        await invite.mutateAsync({
          id,
          email: trimmed,
          role,
          access: access.role
            ? { role: access.role, warehouseIds: access.warehouseIds }
            : null,
        })
      )
    } catch (error) {
      // Déjà membre ou déjà invitée : l'explication va sous l'adresse.
      if (
        isProblem(error, ProblemCode.memberAlreadyExists) ||
        isProblem(error, ProblemCode.invitationAlreadyPending)
      )
        setEmailError(error.detail || error.title)
      else toast.error(errorMessage(error))
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      className="space-y-6 p-4"
    >
      <Field data-invalid={!!emailError}>
        <FieldLabel htmlFor="invite-email">{t("team.invite.email")}</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="invite-email"
            type="email"
            autoFocus
            autoComplete="off"
            maxLength={FieldLimits.email}
            placeholder={t("team.invite.emailPlaceholder")}
            value={email}
            aria-invalid={!!emailError}
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailError(null)
            }}
          />
          <InputGroupAddon>
            <MailIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldError
          errors={[emailError ? { message: emailError } : undefined]}
        />
      </Field>

      {roles.length > 1 && (
        <div
          role="radiogroup"
          aria-label={t("team.role.label")}
          className="grid gap-2 sm:grid-cols-2"
        >
          {roles.map((candidate) => (
            <button
              key={candidate}
              type="button"
              role="radio"
              aria-checked={role === candidate}
              onClick={() => setRole(candidate)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
                role === candidate
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-foreground/20 hover:bg-muted/40"
              )}
            >
              <span className="block text-sm font-semibold">
                {t(`team.role.${candidate}.label`)}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t(`team.role.${candidate}.hint`)}
              </span>
            </button>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold">{t("team.stockRoles.title")}</h3>
        <StockAccessFields value={access} onChange={setAccess} />
      </section>

      <Button
        type="submit"
        size="xl"
        className="w-full"
        disabled={invite.isPending || !isAccessComplete(access)}
      >
        {invite.isPending ? <Spinner data-icon="inline-start" /> : <SendIcon />}
        {t("team.invite.submit")}
      </Button>
    </form>
  )
}
