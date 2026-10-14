"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Splash } from "@/components/app/splash"
import { DepotScene } from "@/components/illustrations/depot-scene"
import { DocumentScene } from "@/components/illustrations/document-scene"
import { OutboundScene } from "@/components/illustrations/outbound-scene"
import { PackagingScene } from "@/components/illustrations/packaging-scene"
import { ValidatedScene } from "@/components/illustrations/validated-scene"
import { useQuantityLabel } from "@/components/items/describe"
import { FormWizard, type WizardStep } from "@/components/wizard/form-wizard"
import { CatalogStatus, type Warehouse } from "@/lib/api/stock"
import { useWarehouses } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useRecordVoucher } from "@/lib/api/voucher-queries"
import { shortagesOf, VoucherType } from "@/lib/api/vouchers"
import { RecordRoutes, Routes } from "@/lib/routes"

import { VoucherDetailsFields } from "./voucher-details-fields"
import {
  todayOn,
  toVoucherInput,
  voucherFormSchema,
  type VoucherFormValues,
} from "./voucher-form-schema"
import { VoucherLinesField } from "./voucher-lines-field"
import { VoucherSummary } from "./voucher-summary"
import { WarehouseChoiceField } from "./warehouse-choice-field"

export function VoucherWizard({ type }: { type: VoucherType }) {
  const t = useTranslations("common")
  const warehouses = useWarehouses(CatalogStatus.active, { fresh: true })
  if (!warehouses.data || !warehouses.isFetchedAfterMount)
    return <Splash label={t("loading")} />
  return <VoucherWizardSteps type={type} warehouses={warehouses.data} />
}

/** Réception ou sortie, en quatre questions : quel dépôt, quoi, pour qui, tout est juste ? */
function VoucherWizardSteps({
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
  const record = useRecordVoucher()
  // Créés une seule fois : un nouvel envoi après une coupure réseau ne compte pas le bon deux fois.
  const [id] = useState(() => crypto.randomUUID())
  const [today] = useState(todayOn)

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
      warehouseId: warehouses.length === 1 ? warehouses[0].id : "",
      lines: [],
      counterparty: "",
      documentReference: "",
      note: "",
      occurredOn: today,
    },
  })

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

  const steps: WizardStep<VoucherFormValues>[] = [
    {
      key: "warehouse",
      illustration: <DepotScene />,
      title: t(`vouchers.wizard.${type}.warehouse.title`),
      description: t(`vouchers.wizard.${type}.warehouse.description`),
      fields: ["warehouseId"],
      content: <WarehouseChoiceField form={form} warehouses={warehouses} />,
    },
    {
      key: "lines",
      illustration:
        type === VoucherType.receipt ? <PackagingScene /> : <OutboundScene />,
      title: t(`vouchers.wizard.${type}.lines.title`),
      description: t(`vouchers.wizard.${type}.lines.description`),
      fields: ["lines"],
      content: <VoucherLinesField form={form} type={type} />,
    },
    {
      key: "details",
      illustration: <DocumentScene />,
      title: t(`vouchers.wizard.${type}.details.title`),
      description: t(`vouchers.wizard.${type}.details.description`),
      fields: ["counterparty", "documentReference", "occurredOn", "note"],
      content: <VoucherDetailsFields form={form} type={type} today={today} />,
    },
    {
      key: "summary",
      illustration: <ValidatedScene />,
      title: t(`vouchers.wizard.${type}.summary.title`),
      description: t(`vouchers.wizard.${type}.summary.description`),
      fields: [],
      content: (
        <VoucherSummary form={form} type={type} warehouses={warehouses} />
      ),
    },
  ]

  return (
    <FormWizard
      form={form}
      steps={steps}
      eyebrow={t(`vouchers.wizard.${type}.eyebrow`)}
      nextLabel={t("common.continue")}
      submitLabel={t(`vouchers.wizard.${type}.submit`)}
      submitting={record.isPending}
      exitLabel={t("common.cancel")}
      onExit={() => router.push(Routes.vouchers)}
      onSubmit={async (values) => {
        try {
          const voucher = await record.mutateAsync({
            id,
            input: toVoucherInput(type, values, today),
          })
          toast.success(
            t(`vouchers.wizard.${type}.done`, { number: voucher.number })
          )
          router.replace(RecordRoutes.voucher(voucher.id))
          return true
        } catch (error) {
          if (!placeShortages(error)) toast.error(errorMessage(error))
          return false
        }
      }}
    />
  )
}
