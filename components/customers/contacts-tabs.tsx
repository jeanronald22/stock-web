"use client"

import { ContactRoundIcon, TruckIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import { Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

const TABS = [
  { href: Routes.suppliers, icon: TruckIcon, label: "suppliers" },
  { href: Routes.customers, icon: ContactRoundIcon, label: "customers" },
] as const

/** « Contacts » (D30) : fournisseurs et clients, deux onglets d'une même entrée de menu. */
export function ContactsTabs() {
  const t = useTranslations("contacts")
  const pathname = usePathname()
  return (
    <nav
      aria-label={t("title")}
      className="mt-6 inline-flex rounded-xl border bg-muted/40 p-1"
    >
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {t(label)}
          </Link>
        )
      })}
    </nav>
  )
}
