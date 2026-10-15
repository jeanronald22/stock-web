"use client"

import { LockKeyholeIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { Splash } from "@/components/app/splash"
import { EmptyState } from "@/components/catalog/empty-state"
import { CatalogScene } from "@/components/illustrations/catalog-scene"
import { DepotsScene } from "@/components/illustrations/depots-scene"
import { DocumentScene } from "@/components/illustrations/document-scene"
import { buttonVariants } from "@/components/ui/button"
import { StepShell } from "@/components/wizard/step-shell"
import { PageBody } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { ProblemCode } from "@/lib/api/problem"
import {
  baseUnits,
  CatalogStatus,
  StockPermission,
  type BaseUnit,
  type Warehouse,
} from "@/lib/api/stock"
import { useCategories, useWarehouses } from "@/lib/api/stock-queries"
import { planCategories } from "@/lib/import/category-plan"
import {
  autoMap,
  ImportField,
  type ColumnMapping,
} from "@/lib/import/import-fields"
import { downloadWorkbook } from "@/lib/import/import-files"
import { prepareRows, type PreparedRow } from "@/lib/import/prepare-rows"
import { Routes } from "@/lib/routes"

import { ImportColumnsStep } from "./import-columns-step"
import { ImportFileStep, type ChosenFile } from "./import-file-step"
import { ImportResultStep } from "./import-result-step"
import { ImportReviewStep } from "./import-review-step"
import { ImportWarehousesStep } from "./import-warehouses-step"
import { ImportPhase, useItemImport } from "./use-item-import"

const FORM_ID = "item-import"
const Step = {
  file: 0,
  columns: 1,
  warehouses: 2,
  review: 3,
  result: 4,
} as const
type Step = (typeof Step)[keyof typeof Step]
const STEP_COUNT = Object.keys(Step).length
const BLOCKED_FILE = "articles-a-corriger.xlsx"
const REJECTED_FILE = "articles-refuses.xlsx"

/** Refus de l'API rapporté au bilan d'import : son message (import.serverReasons). */
const ServerReason = {
  referenceTaken: "referenceTaken",
  barcodeTaken: "barcodeTaken",
  categoryUnavailable: "categoryUnavailable",
  warehouseUnavailable: "warehouseUnavailable",
  accessDenied: "accessDenied",
  batchRequired: "batchRequired",
  quantityNotWhole: "quantityNotWhole",
  other: "other",
} as const
type ServerReason = (typeof ServerReason)[keyof typeof ServerReason]

const SERVER_REASONS: Record<string, ServerReason> = {
  [ProblemCode.itemReferenceTaken]: ServerReason.referenceTaken,
  [ProblemCode.itemBarcodeTaken]: ServerReason.barcodeTaken,
  [ProblemCode.categoryUnavailable]: ServerReason.categoryUnavailable,
  [ProblemCode.warehouseUnavailable]: ServerReason.warehouseUnavailable,
  [ProblemCode.stockAccessDenied]: ServerReason.accessDenied,
  [ProblemCode.batchRequired]: ServerReason.batchRequired,
  [ProblemCode.quantityNotWhole]: ServerReason.quantityNotWhole,
}

export function ImportScreen() {
  const t = useTranslations()
  const manages = useStockAccess().can(StockPermission.manageCatalog)
  const warehouses = useWarehouses(CatalogStatus.active, { fresh: true })
  const categories = useCategories()
  if (!manages)
    return (
      <PageBody>
        <EmptyState
          illustration={
            <LockKeyholeIcon className="mx-auto size-16 text-muted-foreground" />
          }
          title={t("import.denied.title")}
          description={t("import.denied.description")}
          action={
            <Link href={Routes.items} className={buttonVariants()}>
              {t("import.denied.back")}
            </Link>
          }
        />
      </PageBody>
    )
  // Liste relue : les dépôts cochés d'office sont ceux d'aujourd'hui, pas ceux du cache.
  if (!warehouses.data || !warehouses.isFetchedAfterMount || !categories.data)
    return <Splash label={t("common.loading")} />
  return <ImportWizard warehouses={warehouses.data} />
}

/**
 * Import du catalogue (D36) en cinq temps : le fichier, ses colonnes, les dépôts, la vérification,
 * puis l'import et son bilan. Rien n'est envoyé avant la vérification.
 */
function ImportWizard({ warehouses }: { warehouses: Warehouse[] }) {
  const t = useTranslations()
  const router = useRouter()
  const access = useStockAccess()
  const categories = useCategories()
  const run = useItemImport()
  const covered = warehouses.filter((warehouse) => access.covers(warehouse.id))

  const [step, setStep] = useState<Step>(Step.file)
  const [chosen, setChosen] = useState<ChosenFile | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [selected, setSelected] = useState(() =>
    covered.map((warehouse) => warehouse.id)
  )
  const [openingChoice, setOpeningChoice] = useState<string | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)

  const stockMapped = mapping?.[ImportField.stock] != null
  const openingCandidates = access.can(StockPermission.correctStock)
    ? covered.filter((warehouse) => selected.includes(warehouse.id))
    : []
  // Un seul dépôt possible : il est retenu sans qu'on ait à le choisir.
  const openingWarehouseId =
    openingCandidates.length === 1
      ? openingCandidates[0].id
      : openingCandidates.some((warehouse) => warehouse.id === openingChoice)
        ? openingChoice
        : null
  const withOpening = stockMapped && openingWarehouseId !== null

  const unitLabels = useMemo(
    () =>
      Object.fromEntries(
        baseUnits.map((unit) => [unit, t(`units.${unit}.label`)])
      ) as Record<BaseUnit, string>,
    [t]
  )
  const prepared = useMemo(
    () =>
      chosen && mapping
        ? prepareRows(chosen.table, mapping, {
            unitLabels,
            warehouseIds: selected,
            withOpening,
          })
        : [],
    [chosen, mapping, unitLabels, selected, withOpening]
  )
  const ready = prepared.filter((row) => row.problems.length === 0)
  const blocked = prepared.filter((row) => row.problems.length > 0)
  const newCategories = useMemo(
    () => planCategories(ready, categories.data ?? []).created.length,
    [ready, categories.data]
  )

  const serverReason = (code: string) =>
    t(`import.serverReasons.${SERVER_REASONS[code] ?? ServerReason.other}`)
  const download = (
    fileName: string,
    rows: { row: PreparedRow; reason: string }[]
  ) =>
    chosen &&
    void downloadWorkbook(fileName, [
      {
        name: t("import.templateSheet"),
        headers: [...chosen.table.headers, t("import.reasonColumn")],
        rows: rows.map(({ row, reason }) => [
          ...chosen.table.headers.map((_, index) => row.cells[index] ?? null),
          reason,
        ]),
      },
    ])

  const go = (next: Step) => {
    setStepError(null)
    setStep(next)
  }
  const submit = () => {
    if (step === Step.file) {
      if (!chosen) return setStepError(t("import.file.required"))
      return go(Step.columns)
    }
    if (step === Step.columns) {
      if (mapping?.[ImportField.name] == null)
        return setStepError(t("import.columns.nameRequired"))
      return go(Step.warehouses)
    }
    if (step === Step.warehouses) {
      if (covered.length > 0 && selected.length === 0)
        return setStepError(t("import.warehouses.required"))
      if (stockMapped && openingCandidates.length > 0 && !openingWarehouseId)
        return setStepError(t("import.warehouses.opening.required"))
      return go(Step.review)
    }
    if (step === Step.review) {
      if (ready.length === 0) return setStepError(t("import.review.nothing"))
      go(Step.result)
      return void run.start(ready, withOpening ? openingWarehouseId : null)
    }
    if (run.phase === ImportPhase.interrupted) return void run.resume()
    if (run.phase === ImportPhase.done) router.push(Routes.items)
  }

  const running = step === Step.result && run.phase === ImportPhase.running
  const openingName =
    warehouses.find((warehouse) => warehouse.id === openingWarehouseId)?.name ??
    null
  const screens: Record<
    Step,
    {
      title: string
      description: string
      illustration?: React.ReactNode
      submit: string
    }
  > = {
    [Step.file]: {
      title: t("import.file.title"),
      description: t("import.file.description"),
      illustration: <DocumentScene />,
      submit: t("common.continue"),
    },
    [Step.columns]: {
      title: t("import.columns.title"),
      description: t("import.columns.description"),
      illustration: <CatalogScene />,
      submit: t("common.continue"),
    },
    [Step.warehouses]: {
      title: t("import.warehouses.title"),
      description: t("import.warehouses.description"),
      illustration: <DepotsScene />,
      submit: t("common.continue"),
    },
    [Step.review]: {
      title: t("import.review.title"),
      description: t("import.review.description"),
      submit: t("import.review.submit", { count: ready.length }),
    },
    [Step.result]: {
      title:
        run.phase === ImportPhase.done
          ? t("import.result.title", { count: run.report.imported })
          : run.phase === ImportPhase.interrupted
            ? t("import.result.interrupted")
            : t("import.result.running"),
      description:
        run.phase === ImportPhase.done
          ? t("import.result.description")
          : t("import.result.runningDescription"),
      submit:
        run.phase === ImportPhase.done
          ? t("import.result.seeItems")
          : run.phase === ImportPhase.interrupted
            ? t("import.result.resume")
            : t("import.result.running"),
    },
  }
  const screen = screens[step]

  return (
    <StepShell
      step={step + 1}
      totalSteps={STEP_COUNT}
      illustration={screen.illustration}
      wide={!screen.illustration}
      eyebrow={t("import.eyebrow")}
      title={screen.title}
      description={screen.description}
      formId={FORM_ID}
      submitLabel={screen.submit}
      submitting={running}
      onBack={
        step > Step.file && step < Step.result
          ? () => go((step - 1) as Step)
          : undefined
      }
      onExit={() => router.push(Routes.items)}
      exitLabel={step === Step.result ? t("common.close") : t("common.cancel")}
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="space-y-4"
      >
        {step === Step.file && (
          <ImportFileStep
            chosen={chosen}
            error={stepError}
            onChosen={(file) => {
              setChosen(file)
              setMapping(autoMap(file.table.headers))
              setStepError(null)
            }}
          />
        )}
        {step === Step.columns && chosen && mapping && (
          <ImportColumnsStep
            table={chosen.table}
            mapping={mapping}
            onChange={setMapping}
          />
        )}
        {step === Step.warehouses && (
          <ImportWarehousesStep
            warehouses={covered}
            selected={selected}
            onSelected={setSelected}
            stockMapped={stockMapped}
            openingCandidates={openingCandidates}
            openingWarehouseId={openingWarehouseId}
            onOpeningWarehouse={setOpeningChoice}
          />
        )}
        {step === Step.review && (
          <ImportReviewStep
            ready={ready}
            blocked={blocked}
            newCategories={newCategories}
            openingWarehouse={withOpening ? openingName : null}
            onDownloadBlocked={() =>
              download(
                BLOCKED_FILE,
                blocked.map((row) => ({
                  row,
                  reason: row.problems
                    .map((problem) => t(`import.review.problems.${problem}`))
                    .join(" ; "),
                }))
              )
            }
          />
        )}
        {step === Step.result && (
          <ImportResultStep
            phase={run.phase}
            progress={run.progress}
            report={run.report}
            error={run.error}
            serverReason={serverReason}
            onDownloadRejected={() =>
              download(
                REJECTED_FILE,
                run.report.rejected.map(({ row, code }) => ({
                  row,
                  reason: serverReason(code),
                }))
              )
            }
          />
        )}
        {stepError && step !== Step.file && (
          <p role="alert" className="text-sm text-destructive">
            {stepError}
          </p>
        )}
      </form>
    </StepShell>
  )
}
