"use client"

import { CameraOffIcon, ScanBarcodeIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
} from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { barcodeReader } from "@/lib/scan/barcode-reader"

/** Une image analysée toutes les 150 ms : assez vif, sans faire chauffer le téléphone. */
const SCAN_INTERVAL_MS = 150
/** Petite vibration à la lecture : on sait que c'est pris sans regarder l'écran. */
const VIBRATION_MS = 60

const State = {
  starting: "starting",
  scanning: "scanning",
  blocked: "blocked",
} as const
type State = (typeof State)[keyof typeof State]

/**
 * Scan par la caméra arrière (D34). Un code lu ferme la fenêtre et le renvoie ; sans caméra (refus,
 * ordinateur), le code se tape, comme le ferait une douchette.
 */
export function BarcodeScanner({
  open,
  onOpenChange,
  onDetected,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDetected: (code: string) => void
  title?: string
}) {
  const t = useTranslations("scan")
  const done = (code: string) => {
    onDetected(code)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {/* Monté à chaque ouverture : la caméra démarre, puis s'arrête à la fermeture. */}
        {open && <Camera onDetected={done} />}
        <TypedCode onSubmit={done} />
      </DialogContent>
    </Dialog>
  )
}

function Camera({ onDetected }: { onDetected: (code: string) => void }) {
  const t = useTranslations("scan")
  const video = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<State>(State.starting)
  // Hors des dépendances de l'effet : la caméra ne redémarre pas à chaque rendu du parent.
  const detected = useEffectEvent((code: string) => {
    navigator.vibrate?.(VIBRATION_MS)
    onDetected(code)
  })

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: number | undefined
    let stopped = false

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        if (stopped || !video.current) return
        video.current.srcObject = stream
        await video.current.play()
        const reader = await barcodeReader()
        setState(State.scanning)
        const tick = async () => {
          if (stopped || !video.current) return
          const found = await reader.detect(video.current).catch(() => [])
          const code = found[0]?.rawValue?.trim()
          if (code) {
            stopped = true
            return detected(code)
          }
          timer = window.setTimeout(() => void tick(), SCAN_INTERVAL_MS)
        }
        void tick()
      } catch {
        if (!stopped) setState(State.blocked)
      }
    }
    void start()
    return () => {
      stopped = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
      <video
        ref={video}
        muted
        playsInline
        className="size-full object-cover"
        aria-label={t("camera")}
      />
      {state === State.scanning && (
        // Cadre de visée : où placer le code.
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]"
        />
      )}
      {state === State.starting && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <Spinner />
        </div>
      )}
      {state === State.blocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white">
          <CameraOffIcon className="size-6" aria-hidden />
          {t("blocked")}
        </div>
      )}
    </div>
  )
}

/** Sans caméra : le code se tape (ou la douchette le tape). */
function TypedCode({ onSubmit }: { onSubmit: (code: string) => void }) {
  const t = useTranslations("scan")
  const [typed, setTyped] = useState("")
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const code = typed.trim()
    if (!code) return
    setTyped("")
    onSubmit(code)
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <InputGroup>
        <InputGroupInput
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={t("typePlaceholder")}
          aria-label={t("type")}
          autoComplete="off"
        />
      </InputGroup>
      <Button type="submit" variant="outline" disabled={!typed.trim()}>
        <ScanBarcodeIcon />
        {t("use")}
      </Button>
    </form>
  )
}
