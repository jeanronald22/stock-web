"use client"

import { CheckIcon, CircleIcon, ShieldCheckIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useRequestVerification } from "@/lib/api/company-queries"
import { KybStatus, type Company, type KybRequirement } from "@/lib/api/company"
import { useErrorMessage } from "@/lib/api/use-error-message"

import { KybAnchors } from "./kyb-anchors"

/** Ce qu'il faut pour chaque niveau (D6), dans l'ordre de la fiche. */
const LEVELS: readonly {
  level: 1 | 2
  requirements: readonly KybRequirement[]
}[] = [
  {
    level: 1,
    requirements: ["RESPONSIBLE_NAME", "MANAGER_ID", "ADDRESS_OR_PREMISES"],
  },
  { level: 2, requirements: ["BUSINESS_IDS", "BUSINESS_ID_PROOFS"] },
]

/** Où compléter chaque exigence : le lien mène au champ ou à la pièce. */
const REQUIREMENT_ANCHORS: Record<KybRequirement, string> = {
  RESPONSIBLE_NAME: KybAnchors.responsible,
  MANAGER_ID: KybAnchors.documents,
  ADDRESS_OR_PREMISES: KybAnchors.address,
  BUSINESS_IDS: KybAnchors.businessIds,
  BUSINESS_ID_PROOFS: KybAnchors.documents,
}

type Stage =
  "undeclared" | "declared" | "ready" | "pending" | "verified" | "rejected"

const STAGE_BADGES: Record<
  Stage,
  "outline" | "info" | "warning" | "success" | "danger"
> = {
  undeclared: "outline",
  declared: "info",
  ready: "info",
  pending: "warning",
  verified: "success",
  rejected: "danger",
}

function stageOf(kyb: Company["kyb"]): Stage {
  if (kyb.status === KybStatus.approved) return "verified"
  if (kyb.status === KybStatus.pending) return "pending"
  if (kyb.declarationMissing.length > 0) return "undeclared"
  if (kyb.status === KybStatus.rejected) return "rejected"
  return kyb.verificationMissing.length > 0 ? "declared" : "ready"
}

/**
 * Niveau du KYB (D6, D45) et ce qui manque pour le suivant ; la demande de vérification s'envoie
 * d'ici quand tout est déposé. La décision revient à Kreskala.
 */
export function KybLevelCard({ company }: { company: Company }) {
  const t = useTranslations("settings.company.kyb")
  const format = useFormatter()
  const errorMessage = useErrorMessage()
  const request = useRequestVerification()
  const { kyb } = company
  const stage = stageOf(kyb)
  const missing = new Set([
    ...kyb.declarationMissing,
    ...kyb.verificationMissing,
  ])
  // Après un refus, la demande se renvoie une fois les pièces complètes.
  const canRequest =
    (stage === "ready" || stage === "rejected") && missing.size === 0

  return (
    <section
      aria-labelledby="kyb-title"
      className="mb-10 rounded-2xl border p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <ShieldCheckIcon
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <h2 id="kyb-title" className="font-semibold">
              {t("title")}
            </h2>
            <Badge variant={STAGE_BADGES[stage]}>{t(`stages.${stage}`)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`hints.${stage}`, {
              date: kyb.requestedAt
                ? format.dateTime(new Date(kyb.requestedAt), {
                    dateStyle: "long",
                  })
                : "",
            })}
          </p>
        </div>
        {canRequest && (
          <Button
            size="lg"
            className="shrink-0"
            disabled={request.isPending}
            onClick={() =>
              request.mutate(undefined, {
                onSuccess: () => toast.success(t("requested")),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            {request.isPending && <Spinner />}
            {t("request")}
          </Button>
        )}
      </div>

      <ol className="mt-5 grid gap-5 border-t pt-5 sm:grid-cols-2">
        {LEVELS.map(({ level, requirements }) => (
          <li key={level}>
            <h3 className="text-sm font-medium">{t(`levels.${level}`)}</h3>
            <ul className="mt-2 space-y-1.5">
              {requirements.map((requirement) => {
                const done = !missing.has(requirement)
                return (
                  <li
                    key={requirement}
                    className="flex items-start gap-2 text-sm"
                  >
                    {done ? (
                      <CheckIcon
                        className="mt-0.5 size-4 shrink-0 text-success"
                        aria-hidden
                      />
                    ) : (
                      <CircleIcon
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                    <span className="sr-only">
                      {done ? t("done") : t("missing")}
                    </span>
                    {done ? (
                      <span className="text-muted-foreground">
                        {t(`requirements.${requirement}`)}
                      </span>
                    ) : (
                      <a
                        href={`#${REQUIREMENT_ANCHORS[requirement]}`}
                        className="font-medium underline underline-offset-4"
                      >
                        {t(`requirements.${requirement}`)}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}
