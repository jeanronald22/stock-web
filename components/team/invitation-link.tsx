"use client"

import { CheckIcon, CopyIcon, MessageCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback } from "react"
import { toast } from "sonner"

import { buttonVariants } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useCopy } from "@/hooks/use-copy"

/** Partage WhatsApp sans application installée côté ordinateur : wa.me ouvre WhatsApp Web. */
const WHATSAPP_SHARE = "https://wa.me/?text="

/** Lien d'invitation à copier ou à envoyer par WhatsApp ; il n'est montré qu'une fois. */
export function InvitationLink({
  link,
  organizationName,
}: {
  link: string
  organizationName: string
}) {
  const t = useTranslations("team.link")
  const { copied, copy } = useCopy(
    useCallback(() => toast.error(t("copyFailed")), [t])
  )
  const message = t("message", { organization: organizationName, link })

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
      <p className="text-sm font-medium">{t("label")}</p>
      <InputGroup>
        <InputGroupInput
          readOnly
          value={link}
          aria-label={t("label")}
          className="font-mono text-xs"
          onFocus={(event) => event.target.select()}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={t("copy")}
            onClick={() => void copy(link)}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <a
        href={WHATSAPP_SHARE + encodeURIComponent(message)}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "outline", className: "w-full" })}
      >
        <MessageCircleIcon />
        {t("whatsapp")}
      </a>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  )
}
