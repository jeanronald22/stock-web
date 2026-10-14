"use client"

import { CalendarIcon, PackageCheckIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { useQuantityLabel } from "@/components/items/describe"
import { ItemThumb } from "@/components/items/item-thumb"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { StockPermission, wholeQuantityUnits } from "@/lib/api/stock"
import { useReceiveTransfer, useVoucher } from "@/lib/api/voucher-queries"
import {
  TransferState,
  VoucherLimits,
  VoucherType,
  type Voucher,
} from "@/lib/api/vouchers"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { formatQuantityInput, parseQuantity } from "@/lib/forms/quantity"
import { RecordRoutes, Routes } from "@/lib/routes"

import { todayOn } from "./voucher-form-schema"

export function TransferReceiptScreen({ id }: { id: string }) {
  const t = useTranslations()
  const transfer = useVoucher(id)
  const { can, covers } = useStockAccess()

  if (transfer.isPending) {
    return (
      <PageBody>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      </PageBody>
    )
  }
  const data = transfer.data
  const receivable =
    data?.type === VoucherType.transferOut &&
    data.transferState === TransferState.inTransit &&
    !!data.destination &&
    covers(data.destination.id) &&
    can(StockPermission.recordMovements)
  if (!data || !receivable) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("vouchers.receive.unavailable.title")}
          description={t("vouchers.receive.unavailable.description")}
          action={
            <Link
              href={data ? RecordRoutes.voucher(data.id) : Routes.vouchers}
              className={buttonVariants({ variant: "outline" })}
            >
              {data ? data.number : t("vouchers.title")}
            </Link>
          }
        />
      </PageBody>
    )
  }
  return <TransferReceiptForm transfer={data} />
}

/**
 * Réception au dépôt d'arrivée (DECISIONS.md, D27) : la quantité reçue de chaque ligne, pré-remplie
 * avec celle envoyée. Un écart (manquant, casse en route) se saisit ici et reste visible sur les
 * deux bons.
 */
function TransferReceiptForm({ transfer }: { transfer: Voucher }) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const quantityLabel = useQuantityLabel()
  const receive = useReceiveTransfer()
  const [receiptId] = useState(() => crypto.randomUUID())
  const [today] = useState(todayOn)
  const sentOn = transfer.occurredAt.slice(0, 10)
  const [received, setReceived] = useState(() =>
    transfer.lines.map((line) => formatQuantityInput(line.quantity, locale))
  )
  const [occurredOn, setOccurredOn] = useState(today)
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const errors = transfer.lines.map((line, index) => {
    const value = parseQuantity(received[index])
    if (value === null) return t("validation.invalidNumber")
    if (wholeQuantityUnits.has(line.baseUnit) && !Number.isInteger(value))
      return t("validation.wholeNumber")
    return null
  })
  const dateError =
    occurredOn > today
      ? t("vouchers.form.futureDate")
      : occurredOn < sentOn
        ? t("vouchers.receive.beforeSent")
        : null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (errors.some(Boolean) || dateError) return
    try {
      const voucher = await receive.mutateAsync({
        transferId: transfer.id,
        id: receiptId,
        input: {
          // Aujourd'hui : l'API date de l'enregistrement. Un autre jour : midi, heure locale.
          occurredAt:
            occurredOn === today
              ? undefined
              : new Date(`${occurredOn}T12:00:00`).toISOString(),
          note: note.trim() || undefined,
          lines: received.map((value) => ({
            quantity: parseQuantity(value) ?? 0,
          })),
        },
      })
      toast.success(t("vouchers.receive.done", { number: voucher.number }))
      router.replace(RecordRoutes.voucher(voucher.id))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const submitButton = (
    <Button
      type="submit"
      size="xl"
      className="w-full"
      disabled={receive.isPending}
    >
      {receive.isPending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <PackageCheckIcon />
      )}
      {t("vouchers.receive.submit")}
    </Button>
  )

  return (
    <PageBody>
      <PageHeader
        title={t("vouchers.receive.title", { number: transfer.number })}
        breadcrumbs={[
          { label: t("vouchers.title"), href: Routes.vouchers },
          {
            label: transfer.number,
            href: RecordRoutes.voucher(transfer.id),
          },
          { label: t("vouchers.receive.crumb") },
        ]}
        description={t("vouchers.receive.description", {
          source: transfer.warehouse.name,
          destination: transfer.destination?.name ?? "",
        })}
      />
      <form
        onSubmit={(event) => void submit(event)}
        noValidate
        className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      >
        <ul className="space-y-3">
          {transfer.lines.map((line, index) => {
            const value = parseQuantity(received[index])
            const gap = value === null ? null : value - line.quantity
            const inputId = `received-${index}`
            return (
              <li
                key={`${line.itemId}-${index}`}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <ItemThumb imageUrl={line.itemImageUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{line.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("vouchers.receive.sent", {
                        quantity: quantityLabel(line.baseUnit, line.quantity),
                      })}
                      {line.batch &&
                        ` · ${t("vouchers.detail.batch")} ${line.batch}`}
                    </p>
                  </div>
                  {gap !== null && gap !== 0 && (
                    <Badge variant={gap < 0 ? "warning" : "info"}>
                      {t("vouchers.receive.gap", {
                        quantity: quantityLabel(line.baseUnit, Math.abs(gap)),
                        direction: gap < 0 ? "missing" : "extra",
                      })}
                    </Badge>
                  )}
                </div>
                <Field
                  className="mt-3 sm:max-w-xs"
                  data-invalid={submitted && !!errors[index]}
                >
                  <FieldLabel htmlFor={inputId}>
                    {t("vouchers.receive.received")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id={inputId}
                      inputMode="decimal"
                      value={received[index]}
                      aria-invalid={submitted && !!errors[index]}
                      onChange={(event) =>
                        setReceived((current) =>
                          current.map((each, position) =>
                            position === index ? event.target.value : each
                          )
                        )
                      }
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>
                        {t(`units.${line.baseUnit}.short`)}
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {submitted && errors[index] && (
                    <FieldError errors={[{ message: errors[index] }]} />
                  )}
                </Field>
              </li>
            )
          })}
        </ul>

        <aside className="space-y-6 rounded-2xl border p-5 lg:sticky lg:top-20">
          <Field data-invalid={submitted && !!dateError}>
            <FieldLabel htmlFor="occurredOn">
              {t("vouchers.receive.date")}
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="occurredOn"
                type="date"
                min={sentOn}
                max={today}
                value={occurredOn}
                onChange={(event) => setOccurredOn(event.target.value)}
              />
              <InputGroupAddon>
                <CalendarIcon />
              </InputGroupAddon>
            </InputGroup>
            {submitted && dateError && (
              <FieldError errors={[{ message: dateError }]} />
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="note">
              {t("vouchers.form.note")}{" "}
              <span className="font-normal text-muted-foreground">
                ({t("common.optional")})
              </span>
            </FieldLabel>
            <Textarea
              id="note"
              rows={3}
              maxLength={VoucherLimits.note}
              placeholder={t("vouchers.receive.notePlaceholder")}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <div className="hidden lg:block">{submitButton}</div>
        </aside>

        {/* Téléphone : la validation reste sous le pouce. */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
          {submitButton}
        </div>
      </form>
    </PageBody>
  )
}
