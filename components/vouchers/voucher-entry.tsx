"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, WarehouseIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useAuth } from "react-oidc-context"
import { toast } from "sonner"

import { Splash } from "@/components/app/splash"
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
import { useWorkspace } from "@/components/workspace/workspace-context"
import { CatalogStatus, type Warehouse } from "@/lib/api/stock"
import { useWarehouses } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useRecordVoucher } from "@/lib/api/voucher-queries"
import { shortagesOf, VoucherType } from "@/lib/api/vouchers"
import { RecordRoutes, Routes } from "@/lib/routes"
import {
  readLastWarehouse,
  rememberLastWarehouse,
} from "@/lib/vouchers/last-warehouse"

import { SupplierField } from "./supplier-field"
import { VoucherDetailsFields } from "./voucher-details-fields"
import {
  todayOn,
  toVoucherInput,
  voucherFormSchema,
  type VoucherFormValues,
} from "./voucher-form-schema"
import { VoucherLinesField } from "./voucher-lines-field"

export function VoucherEntry({ type }: { type: VoucherType }) {
  const t = useTranslations("common")
  const warehouses = useWarehouses(CatalogStatus.active, { fresh: true })
  // Liste à jour avant de proposer un dépôt : un collègue vient peut-être d'en déclarer un.
  if (!warehouses.data || !warehouses.isFetchedAfterMount)
    return <Splash label={t("loading")} />
  return <VoucherEntryForm type={type} warehouses={warehouses.data} />
}

/**
 * Réception ou sortie sur un seul écran, pensé pour aller vite : dépôt déjà choisi, recherche
 * d'article au clavier, détails facultatifs à côté. Après validation, l'écran se vide pour le bon
 * suivant (même dépôt, même date).
 */
function VoucherEntryForm({
  type,
  warehouses,
}: {
  type: VoucherType
  warehouses: Warehouse[]
}) {
  const t = useTranslations()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const quantityLabel = useQuantityLabel()
  const subject = useAuth().user?.profile.sub
  const { organization } = useWorkspace()
  const record = useRecordVoucher()
  const searchRef = useRef<HTMLInputElement>(null)
  // Un identifiant par bon : renvoyé après une coupure réseau, le même bon n'est pas compté deux fois.
  const [voucherId, setVoucherId] = useState(() => crypto.randomUUID())
  const [today] = useState(todayOn)

  const [defaultWarehouseId] = useState(() => {
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
        },
        today
      )
    ),
    defaultValues: {
      warehouseId: defaultWarehouseId,
      supplier: null,
      lines: [],
      counterparty: "",
      documentReference: "",
      note: "",
      occurredOn: today,
    },
  })
  const lineCount = useWatch({ control: form.control, name: "lines" }).length
  const supplier = useWatch({ control: form.control, name: "supplier" })

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

  const submit = async (values: VoucherFormValues) => {
    try {
      const voucher = await record.mutateAsync({
        id: voucherId,
        input: toVoucherInput(type, values, today),
      })
      rememberLastWarehouse(subject, organization.id, values.warehouseId)
      toast.success(
        t(`vouchers.entry.${type}.done`, { number: voucher.number }),
        {
          action: {
            label: t("vouchers.entry.see"),
            onClick: () => router.push(RecordRoutes.voucher(voucher.id)),
          },
        }
      )
      form.reset({
        ...values,
        supplier: null,
        lines: [],
        counterparty: "",
        documentReference: "",
        note: "",
      })
      setVoucherId(crypto.randomUUID())
      searchRef.current?.focus()
    } catch (error) {
      if (placeShortages(error)) toast.error(t("vouchers.entry.shortages"))
      else toast.error(errorMessage(error))
    }
  }

  const submitButton = (
    <Button
      type="submit"
      size="xl"
      className="w-full"
      disabled={record.isPending}
    >
      {record.isPending && <Spinner data-icon="inline-start" />}
      {t(`vouchers.entry.${type}.submit`, { count: lineCount })}
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
      <form
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        noValidate
        className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
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
                      {t("vouchers.form.warehouse")}
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
            {type === VoucherType.receipt && (
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
          </div>
          <VoucherLinesField
            form={form}
            type={type}
            searchRef={searchRef}
            supplier={supplier}
          />
        </div>

        <aside className="space-y-6 rounded-2xl border p-5 lg:sticky lg:top-20">
          <VoucherDetailsFields form={form} type={type} today={today} />
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
