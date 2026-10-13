import { CheckIcon, PackageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type PreviewRow = {
  name: string
  meta: string
  quantity: string
  status: { label: string; variant: "success" | "warning" | "danger" }
  levelPercent: number
  thresholdPercent: number
}

const rows: PreviewRow[] = [
  {
    name: "Carreau granito Gris Perle 60x60",
    meta: "CAR-GP-6060 · lot L2409",
    quantity: "7 ctn + 2 pc",
    status: { label: "Seuil bas", variant: "warning" },
    levelPercent: 37.5,
    thresholdPercent: 50,
  },
  {
    name: "Mitigeur lavabo chromé",
    meta: "PLB-MIT-L01 · sans lot",
    quantity: "48 pc",
    status: { label: "Disponible", variant: "success" },
    levelPercent: 80,
    thresholdPercent: 20,
  },
  {
    name: "Ciment CPJ 42,5 · sac 50 kg",
    meta: "CIM-425-50",
    quantity: "0 sac",
    status: { label: "Rupture", variant: "danger" },
    levelPercent: 0,
    thresholdPercent: 30,
  },
]

const levelColor: Record<PreviewRow["status"]["variant"], string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
}

function StockPreview({ className }: { className?: string }) {
  return (
    <figure className={cn("relative", className)}>
      <figcaption className="sr-only">
        Aperçu de Kreskala Stock : niveaux de stock d&apos;un dépôt, avec leurs
        états.
      </figcaption>

      <div
        aria-hidden
        className="rounded-2xl bg-background p-4 text-foreground shadow-2xl ring-1 shadow-emerald-950/40 ring-black/5 sm:p-5 dark:ring-white/10"
      >
        <div className="flex items-center justify-between gap-3 pb-4">
          <div>
            <p className="font-mono text-[0.68rem] tracking-[0.07em] text-muted-foreground uppercase">
              Stock disponible
            </p>
            <p className="text-lg font-semibold tracking-tight">
              Dépôt Bonabéri
            </p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-lg bg-success-muted text-success-muted-foreground">
            <PackageIcon className="size-4" />
          </span>
        </div>

        <ul className="grid gap-2.5">
          {rows.map((row) => (
            <li
              key={row.meta}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 rounded-xl border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {row.meta}
                </p>
              </div>
              <div className="grid justify-items-end gap-1">
                <span className="font-mono text-sm font-medium tabular-nums">
                  {row.quantity}
                </span>
                <Badge variant={row.status.variant}>{row.status.label}</Badge>
              </div>
              <div className="relative col-span-2 mt-2.5 h-1.5 rounded-full bg-muted">
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    levelColor[row.status.variant]
                  )}
                  style={{ width: `${row.levelPercent}%` }}
                />
                <span
                  className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground/40"
                  style={{ left: `${row.thresholdPercent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div
        aria-hidden
        className="absolute top-full left-3 flex max-w-[19rem] -translate-y-5 animate-carton-drop items-start gap-3 rounded-2xl bg-foreground p-3.5 text-background shadow-xl [animation-delay:1.8s] sm:-left-8"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-neutral-950">
          <CheckIcon className="size-3.5" strokeWidth={3} />
        </span>
        <p className="text-sm leading-snug">
          <span className="font-semibold">Réception validée.</span> 20 cartons
          ajoutés au dépôt.
          <span className="mt-0.5 block font-mono text-xs opacity-70">
            BR-2026-00042
          </span>
        </p>
      </div>
    </figure>
  )
}

export { StockPreview }
