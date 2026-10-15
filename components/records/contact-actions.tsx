"use client"

import { MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { buttonVariants } from "@/components/ui/button"

/** Numéro international (+237 6 99 …) : le seul que WhatsApp sache ouvrir sans deviner le pays. */
const INTERNATIONAL = /^\+\d[\d\s.-]{6,}$/
const NOT_DIGIT = /\D/g
const WHATSAPP_URL = "https://wa.me/"

/**
 * Joindre un fournisseur ou un client en un geste depuis sa fiche : appeler, écrire sur WhatsApp
 * (le canal de travail au quotidien), envoyer un e-mail. Rien sans coordonnées.
 */
export function ContactActions({
  phone,
  email,
}: {
  phone: string | null
  email?: string | null
}) {
  const t = useTranslations("records.contact")
  if (!phone && !email) return null
  const international = phone && INTERNATIONAL.test(phone.trim())
  return (
    <div className="flex flex-wrap gap-2">
      {phone && (
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <PhoneIcon />
          {t("call")}
        </a>
      )}
      {international && (
        <a
          href={WHATSAPP_URL + phone.replace(NOT_DIGIT, "")}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          <MessageCircleIcon />
          {t("whatsapp")}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <MailIcon />
          {t("email")}
        </a>
      )}
    </div>
  )
}
