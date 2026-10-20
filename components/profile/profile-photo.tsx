"use client"

import { ImageUpIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef } from "react"
import { toast } from "sonner"

import { FormSection } from "@/components/catalog/form-section"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ProfilePhotoRules, type User } from "@/lib/api/platform"
import {
  useRemoveProfilePhoto,
  useUploadProfilePhoto,
} from "@/lib/api/profile-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"

import { PersonAvatar } from "./person-avatar"

/** Photo de profil (D46), enregistrée dès le dépôt : l'équipe la voit à côté du nom. */
export function ProfilePhoto({ user, name }: { user: User; name: string }) {
  const t = useTranslations("profile.photo")
  const errorMessage = useErrorMessage()
  const upload = useUploadProfilePhoto()
  const remove = useRemoveProfilePhoto()
  const input = useRef<HTMLInputElement>(null)
  const busy = upload.isPending || remove.isPending

  const choose = (file: File | undefined) => {
    if (!file) return
    // Un type inconnu du navigateur (vide) est laissé à l'API, qui reconnaît l'image au contenu.
    if (
      file.type &&
      !(ProfilePhotoRules.types as readonly string[]).includes(file.type)
    ) {
      toast.error(t("unsupported"))
      return
    }
    if (file.size > ProfilePhotoRules.maxBytes) {
      toast.error(t("tooLarge"))
      return
    }
    upload.mutate(file, {
      onSuccess: () => toast.success(t("uploaded")),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <FormSection title={t("title")} description={t("description")}>
      <div className="flex flex-wrap items-center gap-5">
        <PersonAvatar
          name={name}
          photoUrl={user.photoUrl}
          className="size-20"
          fallbackClassName="text-2xl"
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={ProfilePhotoRules.types.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              choose(event.target.files?.[0])
              event.target.value = ""
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {upload.isPending ? (
              <Spinner />
            ) : user.photoUrl ? (
              <RefreshCwIcon />
            ) : (
              <ImageUpIcon />
            )}
            {user.photoUrl ? t("replace") : t("upload")}
          </Button>
          {user.photoUrl && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => toast.success(t("removed")),
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              {remove.isPending ? <Spinner /> : <Trash2Icon />}
              {t("remove")}
            </Button>
          )}
        </div>
      </div>
    </FormSection>
  )
}
