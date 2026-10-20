"use client"

import {
  EyeIcon,
  FileCheck2Icon,
  FileUpIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { FormSection } from "@/components/catalog/form-section"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useApi } from "@/lib/api/api-provider"
import {
  useRemoveKybDocument,
  useUploadKybDocument,
} from "@/lib/api/company-queries"
import {
  CompanyLimits,
  KYB_DOCUMENT_TYPES,
  KybDocumentKind,
  isKnownKybDocumentKind,
  type Company,
  type KybDocument,
} from "@/lib/api/company"
import { useErrorMessage } from "@/lib/api/use-error-message"

import { KybAnchors } from "./kyb-anchors"

const PDF_TYPE = "application/pdf"
const BYTES_PER_KB = 1024

/** Pourquoi une pièce manquante est demandée : le niveau 1, la vérification, ou rien (facultative). */
type Need = "levelOne" | "verification" | "optional"

/** La photo du local n'est demandée qu'à défaut d'adresse (D6). */
function needOf(company: Company, kind: string): Need {
  if (kind === KybDocumentKind.premisesPhoto)
    return company.address ? "optional" : "levelOne"
  return kind === KybDocumentKind.managerId ? "levelOne" : "verification"
}

/** Pièce ouverte : son adresse locale vit le temps de l'aperçu. */
type Preview = { kind: string; url: string; contentType: string }

/**
 * Pièces du KYB (D6, D45), une par sorte : déposée, elle remplace la précédente. Chiffrées, elles
 * ne se lisent que par l'API, qui consigne chaque lecture : jamais de lien public.
 */
export function KybDocuments({ company }: { company: Company }) {
  const t = useTranslations("settings.company.documents")
  const [preview, setPreview] = useState<Preview | null>(null)
  const byKind = new Map(company.documents.map((doc) => [doc.kind, doc]))

  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview.url)
  }, [preview])

  return (
    <FormSection
      id={KybAnchors.documents}
      className="scroll-mt-24"
      title={t("title")}
      description={t("description")}
    >
      <ul className="grid gap-3 lg:grid-cols-2">
        {company.documentKinds.map((kind) => (
          <DocumentCard
            key={kind}
            kind={kind}
            document={byKind.get(kind)}
            need={needOf(company, kind)}
            onOpen={setPreview}
          />
        ))}
      </ul>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {preview && <KindName kind={preview.kind} />}
            </DialogTitle>
          </DialogHeader>
          {preview &&
            (preview.contentType === PDF_TYPE ? (
              <iframe
                src={preview.url}
                title={t("previewTitle")}
                className="h-[70vh] w-full rounded-xl border"
              />
            ) : (
              // Adresse locale (blob:) : l'optimisation d'images de Next.js ne s'y applique pas.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt=""
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            ))}
          {preview && (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLinkIcon />
              {t("openInTab")}
            </a>
          )}
        </DialogContent>
      </Dialog>
    </FormSection>
  )
}

function KindName({ kind }: { kind: string }) {
  const t = useTranslations("settings.company.documents.kinds")
  return isKnownKybDocumentKind(kind) ? t(`${kind}.name`) : kind
}

function DocumentCard({
  kind,
  document,
  need,
  onOpen,
}: {
  kind: string
  document: KybDocument | undefined
  need: Need
  onOpen: (preview: Preview) => void
}) {
  const t = useTranslations("settings.company.documents")
  const common = useTranslations("common")
  const format = useFormatter()
  const errorMessage = useErrorMessage()
  const { company: api } = useApi()
  const upload = useUploadKybDocument()
  const remove = useRemoveKybDocument()
  const input = useRef<HTMLInputElement>(null)
  const [opening, setOpening] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const busy = upload.isPending || remove.isPending || opening

  const choose = (file: File | undefined) => {
    if (!file) return
    // Mêmes contrôles que l'API, avant d'envoyer plusieurs mégaoctets pour rien. Un type inconnu
    // du navigateur (vide) est laissé à l'API, qui reconnaît le format au contenu.
    if (
      file.type &&
      !(KYB_DOCUMENT_TYPES as readonly string[]).includes(file.type)
    ) {
      toast.error(t("unsupported"))
      return
    }
    if (file.size > CompanyLimits.documentBytes) {
      toast.error(t("tooLarge"))
      return
    }
    upload.mutate(
      { kind, file },
      {
        onSuccess: () => toast.success(t("uploaded")),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )
  }

  const open = async () => {
    if (!document) return
    setOpening(true)
    try {
      const blob = await api.document(kind)
      onOpen({
        kind,
        url: URL.createObjectURL(blob),
        contentType: document.contentType,
      })
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setOpening(false)
    }
  }

  const sizeOf = (bytes: number) =>
    bytes < BYTES_PER_KB * BYTES_PER_KB
      ? t("sizeKb", { size: Math.max(1, Math.round(bytes / BYTES_PER_KB)) })
      : t("sizeMb", {
          size: format.number(bytes / BYTES_PER_KB / BYTES_PER_KB, {
            maximumFractionDigits: 1,
          }),
        })

  return (
    <li className="flex flex-col rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        {document ? (
          <FileCheck2Icon
            className="mt-0.5 size-5 shrink-0 text-success"
            aria-hidden
          />
        ) : (
          <FileUpIcon
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">
            <KindName kind={kind} />
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isKnownKybDocumentKind(kind)
              ? t(`kinds.${kind}.hint`)
              : t("proofHint", { type: kind })}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {document
              ? t("uploadedOn", {
                  date: format.dateTime(new Date(document.uploadedAt), {
                    dateStyle: "medium",
                  }),
                  size: sizeOf(document.size),
                })
              : t(`missing.${need}`)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept={KYB_DOCUMENT_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            choose(event.target.files?.[0])
            event.target.value = ""
          }}
        />
        {document && (
          <Button variant="outline" size="sm" disabled={busy} onClick={open}>
            {opening ? <Spinner /> : <EyeIcon />}
            {t("view")}
          </Button>
        )}
        <Button
          variant={document || need === "optional" ? "outline" : "default"}
          size="sm"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {upload.isPending ? (
            <Spinner />
          ) : document ? (
            <RefreshCwIcon />
          ) : (
            <FileUpIcon />
          )}
          {document ? t("replace") : t("upload")}
        </Button>
        {document && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setConfirming(true)}
          >
            <Trash2Icon />
            {t("remove")}
          </Button>
        )}
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(kind, {
                  onSuccess: () => {
                    setConfirming(false)
                    toast.success(t("removed"))
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              {remove.isPending && <Spinner />}
              {t("remove")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
