import Link from "next/link"
import { Fragment } from "react"

import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { locales, type AppLocale } from "@/i18n/locales"
import {
  LegalContacts,
  LegalTokens,
  type LegalBlock,
  type LegalDocumentContent,
} from "@/lib/legal/legal-document"
import { PublicQueryParams, Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

type LegalDocumentProps = {
  content: LegalDocumentContent
  locale: AppLocale
  version: string
  updatedOn: string
  /** Adresse de la page, pour les liens de changement de langue. */
  path: string
}

/** Page de document juridique : lisible sur téléphone, sommaire à ancres, langue au choix. */
export function LegalDocument({
  content,
  locale,
  version,
  updatedOn,
  path,
}: LegalDocumentProps) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(updatedOn)
  )

  return (
    <div lang={locale} className="min-h-svh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <Link href={Routes.home} aria-label="Kreskala">
          <KreskalaLogo className="h-9" />
        </Link>
        <nav className="flex rounded-full bg-muted p-1 text-sm font-semibold">
          {locales.map((code) => (
            <Link
              key={code}
              href={`${path}?${PublicQueryParams.lang}=${code}`}
              hrefLang={code}
              aria-current={code === locale ? "true" : undefined}
              className={cn(
                "rounded-full px-3 py-1 text-muted-foreground uppercase",
                code === locale && "bg-background text-foreground shadow-sm"
              )}
            >
              {code}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {content.updatedOnLabel} {date} · {content.versionLabel} {version}
        </p>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {content.summary}
        </p>

        <nav
          aria-label={content.contentsLabel}
          className="mt-10 rounded-xl border bg-muted/40 p-5"
        >
          <h2 className="text-sm font-semibold">{content.contentsLabel}</h2>
          <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {content.sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {content.sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className="mt-12 scroll-mt-6"
          >
            <h2 className="text-2xl font-bold tracking-tight">
              <span className="mr-2 text-primary">{index + 1}.</span>
              {section.title}
            </h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed">
              {section.blocks.map((block, blockIndex) => (
                <Block key={blockIndex} block={block} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === "list") {
    return (
      <ul className="list-disc space-y-2 pl-5 marker:text-primary">
        {block.items.map((item) => (
          <li key={item}>
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <p>
      <InlineText text={block.text} />
    </p>
  )
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(LegalTokens.contact)
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 && (
        <a
          href={`mailto:${LegalContacts.privacy}`}
          className="font-medium text-primary underline underline-offset-4"
        >
          {LegalContacts.privacy}
        </a>
      )}
    </Fragment>
  ))
}
