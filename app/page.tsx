import type { Metadata, Viewport } from "next"
import {
  MicIcon,
  PackageIcon,
  WarehouseIcon,
  WifiOffIcon,
  type LucideIcon,
} from "lucide-react"

import { StockPreview } from "@/app/_components/stock-preview"
import { KreskalaLogo } from "@/components/brand/kreskala-logo"

export const metadata: Metadata = {
  title: "Bientôt disponible",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#007A55" },
    { media: "(prefers-color-scheme: dark)", color: "#002C22" },
  ],
}

type ProductPromise = {
  icon: LucideIcon
  title: string
  text: string
}

const promises: ProductPromise[] = [
  {
    icon: PackageIcon,
    title: "Au carton près",
    text: "Cartons, pièces, m² : chaque article est compté dans son unité, cartons ouverts compris.",
  },
  {
    icon: WifiOffIcon,
    title: "Même sans réseau",
    text: "Vous saisissez hors ligne, tout se synchronise au retour de la connexion.",
  },
  {
    icon: MicIcon,
    title: "À la voix",
    text: "Dites « sortie de 12 sacs de ciment », l'assistant prépare le bon, vous validez.",
  },
  {
    icon: WarehouseIcon,
    title: "Tous vos dépôts",
    text: "Réceptions, sorties, transferts et inventaires, dépôt par dépôt.",
  },
]

// Grille de 48 unités, la même que celle du symbole (charte, chapitre 01).
const gridBackground = {
  backgroundImage:
    "linear-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.07) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  backgroundPosition: "-1px -1px",
}

export default function ComingSoonPage() {
  return (
    <main
      className="relative isolate min-h-svh overflow-hidden bg-emerald-700 text-emerald-50 dark:bg-emerald-950"
      style={gridBackground}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-20%] -z-10 size-[44rem] rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/15"
      />

      <div className="mx-auto flex min-h-svh max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-6">
          <KreskalaLogo tone="on-brand" animated className="h-10 sm:h-12" />
          <span className="inline-flex animate-rise-in items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 font-mono text-[0.7rem] tracking-[0.07em] uppercase [animation-delay:1.2s]">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300 opacity-60" />
              <span className="relative size-2 rounded-full bg-emerald-300" />
            </span>
            Bientôt
            <span className="hidden sm:inline">· Coming soon</span>
          </span>
        </header>

        <section className="grid flex-1 items-center gap-14 pt-12 pb-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12 lg:py-16">
          <div>
            <p className="animate-rise-in font-mono text-xs tracking-[0.07em] text-emerald-200 uppercase [animation-delay:300ms]">
              Kreskala Stock · Lancement au Cameroun
            </p>
            <h1 className="mt-5 animate-rise-in text-5xl leading-[1.02] font-bold tracking-[-0.035em] text-balance text-white [animation-delay:450ms] sm:text-6xl lg:text-7xl">
              <span className="block">Votre stock,</span>
              <span className="block">au carton près.</span>
            </h1>
            <p
              lang="en"
              className="mt-4 animate-rise-in text-xl font-medium text-emerald-200 [animation-delay:600ms] sm:text-2xl"
            >
              Your stock, down to the last box.
            </p>
            <p className="mt-8 max-w-xl animate-rise-in text-lg leading-relaxed text-emerald-50/85 [animation-delay:750ms]">
              La gestion de stock pensée pour les quincailleries, les dépôts de
              matériaux et les PME d&apos;Afrique. Simple sur le téléphone,
              fiable sur le terrain.
            </p>

            <ul className="mt-12 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {promises.map(({ icon: Icon, title, text }, index) => (
                <li
                  key={title}
                  className="flex animate-rise-in gap-4"
                  style={{ animationDelay: `${900 + index * 120}ms` }}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                    <Icon className="size-5 text-emerald-200" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-white">{title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-50/75">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <StockPreview className="mx-auto w-full max-w-md animate-rise-in [animation-delay:1s] lg:ml-auto" />
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/20 py-6 font-mono text-xs text-emerald-100/75 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Kreskala</span>
          <span>Fait pour le terrain · Built for the field</span>
        </footer>
      </div>
    </main>
  )
}
