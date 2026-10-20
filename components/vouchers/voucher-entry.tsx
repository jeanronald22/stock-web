"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowRightLeftIcon,
  ClipboardClockIcon,
  PlusIcon,
  Undo2Icon,
  WarehouseIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"
import {
  Controller,
  useForm,
  useWatch,
  type UseFormReturn,
} from "react-hook-form"
import { useAuth } from "react-oidc-context"
import { toast } from "sonner"

import { Splash } from "@/components/app/splash"
import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { ValidatedScene } from "@/components/illustrations/validated-scene"
import { useQuantityLabel } from "@/components/items/describe"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useWorkspace } from "@/components/workspace/workspace-context"
import { CatalogStatus, type Item, type Warehouse } from "@/lib/api/stock"
import {
  useItem,
  useTransferDestinations,
  useWarehouses,
} from "@/lib/api/stock-queries"
import { isProblem, ProblemCode } from "@/lib/api/problem"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useCustomer } from "@/lib/api/customer-queries"
import { useSupplier } from "@/lib/api/supplier-queries"
import type { Supplier } from "@/lib/api/suppliers"
import type { Customer } from "@/lib/api/customers"
import {
  useRequest,
  useStockSettings,
  useSubmitRequest,
} from "@/lib/api/request-queries"
import { StockPermission } from "@/lib/api/stock"
import {
  approvalTypes,
  RequestPaths,
  type VoucherRequest,
} from "@/lib/api/voucher-requests"
import {
  useAddVoucherPhoto,
  useRecordVoucher,
  useReturnable,
} from "@/lib/api/voucher-queries"
import {
  customerTypes,
  returnOrigins,
  shortagesOf,
  supplierTypes,
  VoucherPaths,
  VoucherType,
  type EntryType,
  type Returnable,
} from "@/lib/api/vouchers"
import { isOnline } from "@/lib/offline/connectivity"
import { OutboxKind, removeOutboxEntry } from "@/lib/offline/outbox"
import { isNetworkError, useEnqueue } from "@/lib/offline/use-enqueue"
import { useOnline } from "@/lib/offline/use-online"
import { useOutbox } from "@/lib/offline/use-outbox"
import {
  EntryQueryParams,
  OUTBOX_ANCHOR,
  RecordRoutes,
  Routes,
} from "@/lib/routes"
import {
  readLastWarehouse,
  rememberLastWarehouse,
} from "@/lib/vouchers/last-warehouse"

import { CustomerField } from "./customer-field"
import { DamagePhotosField } from "./damage-photos-field"
import { ReasonField } from "./reason-field"
import { SupplierField } from "./supplier-field"
import { VoucherDetailsFields } from "./voucher-details-fields"
import {
  BASE_UNIT_CHOICE,
  newLine,
  todayOn,
  toVoucherInput,
  voucherFormSchema,
  type VoucherDraft,
  type VoucherFormValues,
} from "./voucher-form-schema"
import { VoucherLinesField } from "./voucher-lines-field"

/** Lot en cause dans une erreur de l'API (stock-api, ProblemFields.BATCH). */
const BATCH_FIELD = "batch"

/** Retour depuis un bon (D31, ?origine=…) : les lignes qui restent à retourner sont proposées. */
export function VoucherEntry({ type }: { type: EntryType }) {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const originId =
    type in returnOrigins
      ? (searchParams.get(EntryQueryParams.origin) ?? undefined)
      : undefined
  // Refaire une demande refusée ou retirée (D33) : ses lignes, son dépôt et son tiers sont repris.
  const fromRequestId = approvalTypes.has(type)
    ? (searchParams.get(EntryQueryParams.fromRequest) ?? undefined)
    : undefined
  // Bon commencé depuis la fiche d'un article : il est déjà sur le bon.
  const startingItemId = searchParams.get(EntryQueryParams.item) ?? undefined
  const startingItem = useItem(startingItemId)
  // Bon commencé depuis la fiche d'un dépôt, d'un fournisseur ou d'un client.
  const startingWarehouseId =
    searchParams.get(EntryQueryParams.warehouse) ?? undefined
  const startingSupplierId = supplierTypes.has(type)
    ? (searchParams.get(EntryQueryParams.supplier) ?? undefined)
    : undefined
  const startingCustomerId = customerTypes.has(type)
    ? (searchParams.get(EntryQueryParams.customer) ?? undefined)
    : undefined
  const startingSupplier = useSupplier(startingSupplierId)
  const warehouses = useWarehouses(CatalogStatus.active, { fresh: true })
  const settings = useStockSettings()
  const origin = useReturnable(originId)
  const previous = useRequest(fromRequestId)
  const previousCustomer = useCustomer(
    previous.data?.customerId ?? startingCustomerId
  )
  const online = useOnline()
  // Saisie refusée à l'envoi (D39), reprise depuis la file : mêmes valeurs, même identifiant.
  const draftId = searchParams.get(EntryQueryParams.draft) ?? undefined
  const outbox = useOutbox()
  const draftEntry = draftId
    ? outbox.entries.find((entry) => entry.id === draftId)
    : undefined
  const draft = draftEntry && (draftEntry.draft as VoucherDraft)
  // Liste à jour avant de proposer un dépôt : un collègue vient peut-être d'en déclarer un. Hors
  // ligne, celle gardée sur le téléphone fait foi.
  if (
    !warehouses.data ||
    (!warehouses.isFetchedAfterMount && online) ||
    (draftId && !outbox.loaded) ||
    !settings.data ||
    (originId && origin.isPending) ||
    (fromRequestId && previous.isPending) ||
    (startingItemId && startingItem.isPending) ||
    (startingSupplierId && startingSupplier.isPending) ||
    (startingCustomerId && previousCustomer.isPending) ||
    (previous.data?.customerId && previousCustomer.isPending)
  )
    return <Splash label={t("common.loading")} />
  if (originId && !origin.data) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("vouchers.notFound")}
          description=""
          action={
            <Link
              href={Routes.vouchers}
              className={buttonVariants({ variant: "outline" })}
            >
              {t("vouchers.title")}
            </Link>
          }
        />
      </PageBody>
    )
  }
  if (origin.data?.lines.every((line) => line.remaining === 0)) {
    return (
      <PageBody>
        <EmptyState
          illustration={<ValidatedScene />}
          title={t("vouchers.returns.nothingLeft.title")}
          description={t("vouchers.returns.nothingLeft.description", {
            number: origin.data.origin.number,
          })}
          action={
            <Link
              href={RecordRoutes.voucher(origin.data.origin.id)}
              className={buttonVariants({ variant: "outline" })}
            >
              {origin.data.origin.number}
            </Link>
          }
        />
      </PageBody>
    )
  }
  return (
    <VoucherEntryForm
      type={type}
      warehouses={warehouses.data}
      origin={origin.data}
      previous={previous.data}
      previousCustomer={previousCustomer.data}
      startingItem={startingItem.data}
      startingWarehouseId={startingWarehouseId}
      startingSupplier={startingSupplier.data}
      issueApproval={settings.data.issueApproval}
      draft={
        draftEntry && draft?.entryType === type
          ? { id: draftEntry.id, values: draft.values }
          : undefined
      }
    />
  )
}

/**
 * Réception, sortie, transfert, casse, ajustement ou retour sur un seul écran, pensé pour aller vite :
 * dépôt déjà choisi, recherche d'article au clavier, détails à côté. Après validation, l'écran se
 * vide pour le bon suivant (même dépôt, même date).
 */
function VoucherEntryForm({
  type,
  warehouses,
  origin,
  previous,
  previousCustomer,
  startingItem,
  startingWarehouseId,
  startingSupplier,
  issueApproval,
  draft,
}: {
  type: EntryType
  warehouses: Warehouse[]
  origin: Returnable | undefined
  previous: VoucherRequest | undefined
  previousCustomer: Customer | undefined
  /** Article déjà sur le bon (bon commencé depuis sa fiche). */
  startingItem: Item | undefined
  /** Dépôt et fournisseur du bon, quand il part de leur fiche (le client passe par previousCustomer). */
  startingWarehouseId: string | undefined
  startingSupplier: Supplier | undefined
  /** Règle de l'entreprise (D33) : les sorties des magasiniers passent par une validation. */
  issueApproval: boolean
  /** Saisie reprise de la file hors ligne (D39). */
  draft: { id: string; values: VoucherFormValues } | undefined
}) {
  const t = useTranslations()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const quantityLabel = useQuantityLabel()
  const subject = useAuth().user?.profile.sub
  const { organization } = useWorkspace()
  const record = useRecordVoucher()
  const searchRef = useRef<HTMLInputElement>(null)
  const transfer = type === VoucherType.transferOut
  // Un identifiant par bon : renvoyé après une coupure réseau, le même bon n'est pas compté deux fois.
  const [voucherId, setVoucherId] = useState(
    () => draft?.id ?? crypto.randomUUID()
  )
  const enqueue = useEnqueue()
  const [today] = useState(todayOn)
  // Casse : photos choisies avant la validation, envoyées juste après (le bon doit exister).
  const [photos, setPhotos] = useState<File[]>([])
  const addPhoto = useAddVoucherPhoto()

  const [defaultWarehouseId] = useState(() => {
    if (
      startingWarehouseId &&
      warehouses.some((warehouse) => warehouse.id === startingWarehouseId)
    )
      return startingWarehouseId
    if (
      previous &&
      warehouses.some((warehouse) => warehouse.id === previous.warehouse.id)
    )
      return previous.warehouse.id
    // Retour depuis un bon : son dépôt d'abord.
    if (
      origin &&
      warehouses.some((warehouse) => warehouse.id === origin.warehouse.id)
    )
      return origin.warehouse.id
    const last = readLastWarehouse(subject, organization.id)
    if (last && warehouses.some((warehouse) => warehouse.id === last))
      return last
    return warehouses.length === 1 ? warehouses[0].id : ""
  })

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(
      voucherFormSchema(
        {
          required: t("validation.required"),
          tooLong: (max) => t("validation.tooLong", { max }),
          invalidNumber: t("validation.invalidNumber"),
          positive: t("validation.positive"),
          wholeNumber: t("validation.wholeNumber"),
          batchRequired: t("vouchers.form.batchRequired"),
          linesRequired: t("vouchers.form.linesRequired"),
          futureDate: t("vouchers.form.futureDate"),
          reasonRequired: t("vouchers.reasons.required"),
          noteRequired: t("vouchers.form.noteRequired"),
          exceedsOrigin: t("vouchers.returns.exceeds"),
        },
        today,
        type
      )
    ),
    defaultValues: draft?.values ?? {
      warehouseId: defaultWarehouseId,
      destinationWarehouseId: previous?.destination?.id ?? "",
      reason: "",
      supplier:
        previous?.supplierId && previous.counterparty
          ? { id: previous.supplierId, name: previous.counterparty }
          : startingSupplier
            ? { id: startingSupplier.id, name: startingSupplier.name }
            : null,
      customer: previousCustomer
        ? {
            id: previousCustomer.id,
            name: previousCustomer.name,
            kind: previousCustomer.kind,
          }
        : null,
      originId: origin?.origin.id ?? previous?.origin?.id ?? "",
      lines: previous
        ? previous.lines.map((line) => ({
            ...newLine(line.item, type),
            quantity: String(line.enteredQuantity),
            unit: line.packagingName ?? BASE_UNIT_CHOICE,
            batch: line.batch ?? "",
          }))
        : startingItem
          ? [newLine(startingItem, type)]
          : (origin?.lines ?? [])
              .filter((line) => line.remaining > 0)
              .map((line) =>
                newLine(line.item, type, {
                  batch: line.batch ?? "",
                  limit: line.remaining,
                  quantity: String(line.remaining),
                })
              ),
      counterparty:
        previous && !previous.supplierId && !previous.customerId
          ? (previous.counterparty ?? "")
          : "",
      documentReference: previous?.documentReference ?? "",
      note: previous?.note ?? "",
      occurredOn: today,
    },
  })
  const { can, covers } = useStockAccess()
  const warehouseId = useWatch({ control: form.control, name: "warehouseId" })
  // Même règle que l'API (VoucherApprovals) : qui corrige le stock du dépôt sort sans demande.
  const needsApproval =
    issueApproval &&
    approvalTypes.has(type) &&
    !(can(StockPermission.correctStock) && covers(warehouseId))
  const submitRequest = useSubmitRequest()
  const lineCount = useWatch({ control: form.control, name: "lines" }).length
  const supplier = useWatch({ control: form.control, name: "supplier" })
  const fromOrigin = !!origin

  /** Sortie refusée : le disponible réel s'affiche sous chaque ligne en manque. */
  const placeShortages = (error: unknown): boolean => {
    const shortages = shortagesOf(error)
    form.getValues("lines").forEach((line, index) => {
      const shortage = shortages.find(
        (candidate) =>
          candidate.itemId === line.itemId &&
          (!line.item.batchTracking || candidate.batch === line.batch.trim())
      )
      if (shortage) {
        form.setError(`lines.${index}.quantity`, {
          type: "server",
          message: t("vouchers.form.shortage", {
            available: quantityLabel(line.item.baseUnit, shortage.available),
          }),
        })
      }
    })
    return shortages.length > 0
  }

  /** Lot connu avec une autre nuance ou un autre calibre (D35) : l'erreur va sur sa ligne. */
  const placeBatchMismatch = (error: unknown): boolean => {
    if (!isProblem(error, ProblemCode.batchTraitsMismatch)) return false
    const batch = String(error.body[BATCH_FIELD] ?? "").toLowerCase()
    const index = form
      .getValues("lines")
      .findIndex((line) => line.batch.trim().toLowerCase() === batch)
    if (index < 0) return false
    form.setError(`lines.${index}.batch`, {
      type: "server",
      message: t("vouchers.form.batchMismatch"),
    })
    return true
  }

  /** Le bon est déjà enregistré : une photo refusée se rajoute depuis sa fiche. */
  const sendPhotos = async (id: string): Promise<boolean> => {
    for (const file of photos) {
      try {
        await addPhoto.mutateAsync({ id, file })
      } catch {
        return false
      }
    }
    return true
  }

  /** L'écran se vide pour le bon suivant ; une saisie reprise de la file retourne à la liste. */
  const startNext = (values: VoucherFormValues) => {
    if (draft) return router.replace(`${Routes.vouchers}#${OUTBOX_ANCHOR}`)
    form.reset({
      ...values,
      supplier: null,
      customer: null,
      lines: [],
      counterparty: "",
      documentReference: "",
      note: "",
    })
    setPhotos([])
    setVoucherId(crypto.randomUUID())
    searchRef.current?.focus()
  }

  /**
   * Sans réseau (D39) : le bon part dans la file du téléphone, daté de la saisie, et sera envoyé
   * au retour du réseau. Les photos de casse, elles, demandent le réseau.
   */
  const queue = async (values: VoucherFormValues, approval: boolean) => {
    const input = toVoucherInput(type, values, today)
    const warehouse = warehouses.find(
      (candidate) => candidate.id === values.warehouseId
    )
    try {
      await enqueue({
        id: voucherId,
        kind: approval ? OutboxKind.request : OutboxKind.voucher,
        request: {
          method: "POST",
          path: approval ? RequestPaths.requests : VoucherPaths.vouchers,
          body: {
            id: voucherId,
            ...input,
            occurredAt: input.occurredAt ?? new Date().toISOString(),
          },
        },
        summary: {
          voucherType: type,
          warehouseName: warehouse?.name ?? "",
          lineCount: values.lines.length,
          counterparty:
            values.customer?.name ??
            values.supplier?.name ??
            (values.counterparty || null),
        },
        draft: { entryType: type, values } satisfies VoucherDraft,
      })
    } catch {
      return toast.error(t("offline.queueFailed"))
    }
    rememberLastWarehouse(subject, organization.id, values.warehouseId)
    toast.success(t("offline.queued"), {
      description:
        photos.length > 0 ? t("offline.photosLater") : t("offline.queuedHint"),
    })
    startNext(values)
  }

  /** Demande à valider (D33) : rien ne sort avant la décision ; l'écran se vide pour la suivante. */
  const sendForApproval = async (values: VoucherFormValues) => {
    if (!isOnline()) return queue(values, true)
    try {
      const request = await submitRequest.mutateAsync({
        id: voucherId,
        input: toVoucherInput(type, values, today),
      })
      rememberLastWarehouse(subject, organization.id, values.warehouseId)
      if (draft) await removeOutboxEntry(draft.id)
      toast.success(t("requests.sent"), {
        action: {
          label: t("requests.see"),
          onClick: () => router.push(RecordRoutes.request(request.id)),
        },
      })
      if (previous) return router.replace(RecordRoutes.request(request.id))
      startNext(values)
    } catch (error) {
      if (isNetworkError(error)) return queue(values, true)
      toast.error(errorMessage(error))
    }
  }

  const submit = async (values: VoucherFormValues) => {
    if (needsApproval) return sendForApproval(values)
    if (!isOnline()) return queue(values, false)
    try {
      const voucher = await record.mutateAsync({
        id: voucherId,
        input: toVoucherInput(type, values, today),
      })
      rememberLastWarehouse(subject, organization.id, values.warehouseId)
      if (draft) await removeOutboxEntry(draft.id)
      // Un retour depuis un bon est complet : on ouvre le bon plutôt qu'un écran vide.
      if (fromOrigin) {
        toast.success(
          t(`vouchers.entry.${type}.done`, { number: voucher.number })
        )
        router.replace(RecordRoutes.voucher(voucher.id))
        return
      }
      const photosSent = await sendPhotos(voucher.id)
      toast[photosSent ? "success" : "warning"](
        photosSent
          ? t(`vouchers.entry.${type}.done`, { number: voucher.number })
          : t("vouchers.photos.partial", { number: voucher.number }),
        {
          action: {
            label: t("vouchers.entry.see"),
            onClick: () => router.push(RecordRoutes.voucher(voucher.id)),
          },
        }
      )
      startNext(values)
    } catch (error) {
      if (isNetworkError(error)) return queue(values, false)
      if (placeShortages(error)) toast.error(t("vouchers.entry.shortages"))
      else if (placeBatchMismatch(error))
        toast.error(t("vouchers.form.batchMismatchToast"))
      else toast.error(errorMessage(error))
    }
  }

  const submitButton = (
    <Button
      type="submit"
      size="xl"
      className="w-full"
      disabled={
        record.isPending || addPhoto.isPending || submitRequest.isPending
      }
    >
      {(record.isPending || addPhoto.isPending || submitRequest.isPending) && (
        <Spinner data-icon="inline-start" />
      )}
      {needsApproval
        ? t("requests.submit", { count: lineCount })
        : t(`vouchers.entry.${type}.submit`, { count: lineCount })}
    </Button>
  )

  return (
    <PageBody>
      <PageHeader
        title={t(`vouchers.entry.${type}.title`)}
        breadcrumbs={[
          { label: t("vouchers.title"), href: Routes.vouchers },
          { label: t(`vouchers.entry.${type}.title`) },
        ]}
        description={t(`vouchers.entry.${type}.description`)}
      />
      {origin && <OriginBanner origin={origin} />}
      <form
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        noValidate
        className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {warehouses.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5">
                <p className="text-muted-foreground">
                  {t("vouchers.form.noWarehouse")}
                </p>
                <Link
                  href={Routes.newWarehouse}
                  className={buttonVariants({
                    variant: "outline",
                    className: "mt-4",
                  })}
                >
                  <PlusIcon />
                  {t("vouchers.form.createWarehouse")}
                </Link>
              </div>
            ) : (
              <Controller
                control={form.control}
                name="warehouseId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="warehouseId">
                      {transfer
                        ? t("vouchers.form.fromWarehouse")
                        : t("vouchers.form.warehouse")}
                    </FieldLabel>
                    <Select
                      items={warehouses.map((warehouse) => ({
                        value: warehouse.id,
                        label: warehouse.name,
                      }))}
                      value={field.value || null}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger
                        id="warehouseId"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <WarehouseIcon
                          className="size-5 text-muted-foreground"
                          aria-hidden
                        />
                        <SelectValue
                          placeholder={t("vouchers.form.chooseWarehouse")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )}
            {transfer && <DestinationField form={form} />}
            {supplierTypes.has(type) && !fromOrigin && (
              <Controller
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="supplier">
                      {t("vouchers.form.supplier")}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({t("common.optional")})
                      </span>
                    </FieldLabel>
                    <SupplierField
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
            )}
            {customerTypes.has(type) && !fromOrigin && (
              <PartyCustomerField form={form} />
            )}
          </div>
          <VoucherLinesField
            form={form}
            type={type}
            searchRef={searchRef}
            supplier={supplier}
            fromOrigin={fromOrigin}
          />
        </div>

        <aside className="space-y-6 rounded-2xl border p-5 lg:sticky lg:top-20">
          {(type === VoucherType.damage || type === VoucherType.adjustment) && (
            <ReasonField form={form} type={type} />
          )}
          {type === VoucherType.damage && (
            <DamagePhotosField files={photos} onChange={setPhotos} />
          )}
          <VoucherDetailsFields form={form} type={type} today={today} />
          {needsApproval && (
            <p className="flex gap-2 rounded-xl bg-warning-muted/60 p-3 text-sm text-warning-muted-foreground">
              <ClipboardClockIcon
                className="mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              {t("requests.approvalHint")}
            </p>
          )}
          <div className="hidden lg:block">{submitButton}</div>
        </aside>

        {/* Téléphone : la validation reste sous le pouce, même en bas d'une longue liste. */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
          {submitButton}
        </div>
      </form>
    </PageBody>
  )
}

/** Retour depuis un bon : de quel bon, de qui ; les lignes en reprennent ce qui reste. */
function OriginBanner({ origin }: { origin: Returnable }) {
  const t = useTranslations("vouchers.returns")
  return (
    <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <Undo2Icon className="size-4 text-muted-foreground" aria-hidden />
      {t("from")}
      <Link
        href={RecordRoutes.voucher(origin.origin.id)}
        className="font-mono font-semibold hover:underline"
      >
        {origin.origin.number}
      </Link>
      {origin.counterparty && (
        <span className="text-muted-foreground">· {origin.counterparty}</span>
      )}
    </p>
  )
}

/** Client ou chantier d'une sortie ou d'un retour client (D30). */
function PartyCustomerField({
  form,
}: {
  form: UseFormReturn<VoucherFormValues>
}) {
  const t = useTranslations()
  const customer = useWatch({ control: form.control, name: "customer" })
  const counterparty = useWatch({ control: form.control, name: "counterparty" })
  return (
    <Field>
      <FieldLabel htmlFor="customer">
        {t("vouchers.form.customer")}{" "}
        <span className="font-normal text-muted-foreground">
          ({t("common.optional")})
        </span>
      </FieldLabel>
      <CustomerField
        customer={customer}
        counterparty={customer ? "" : counterparty}
        onCustomerChange={(chosen) => form.setValue("customer", chosen)}
        onCounterpartyChange={(name) => form.setValue("counterparty", name)}
      />
    </Field>
  )
}

/** Dépôt d'arrivée d'un transfert : tous les dépôts actifs sauf celui de départ (D27). */
function DestinationField({
  form,
}: {
  form: UseFormReturn<VoucherFormValues>
}) {
  const t = useTranslations("vouchers.form")
  const destinations = useTransferDestinations().data ?? []
  const source = useWatch({ control: form.control, name: "warehouseId" })
  const options = destinations
    .filter((warehouse) => warehouse.id !== source)
    .map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))
  return (
    <Controller
      control={form.control}
      name="destinationWarehouseId"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="destinationWarehouseId">
            {t("toWarehouse")}
          </FieldLabel>
          <Select
            items={options}
            value={field.value || null}
            onValueChange={(value) => field.onChange(value ?? "")}
          >
            <SelectTrigger
              id="destinationWarehouseId"
              className="w-full"
              aria-invalid={fieldState.invalid}
            >
              <ArrowRightLeftIcon
                className="size-5 text-muted-foreground"
                aria-hidden
              />
              <SelectValue placeholder={t("chooseDestination")} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
