"use client"

import {
  ArrowRightIcon,
  ArrowRightLeftIcon,
  CircleGaugeIcon,
  HistoryIcon,
  InfoIcon,
  PackageIcon,
  RulerIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { useCategoryTree } from "@/components/categories/use-category-tree"
import { RecordSection } from "@/components/records/record-section"
import {
  RecordNotFound,
  RecordOffline,
  RecordSkeleton,
  RecordState,
  recordState,
} from "@/components/records/record-states"
import { useRecordId } from "@/components/records/use-record-id"
import { useDayAge } from "@/components/records/use-day-age"
import { VoucherHistory } from "@/components/records/voucher-history"
import {
  StockLevelBadge,
  StockStateBadge,
} from "@/components/stock/stock-state-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  CatalogStatus,
  StockPermission,
  StockState,
  type Item,
  type Warehouse,
} from "@/lib/api/stock"
import { useItem, useWarehouses } from "@/lib/api/stock-queries"
import { useItemStock, useVouchersPage } from "@/lib/api/voucher-queries"
import { waitsForNetwork } from "@/lib/offline/waits-for-network"
import {
  ItemSection,
  ListQueryParams,
  RECORD_SECTION_PARAM,
  RecordRoutes,
  Routes,
} from "@/lib/routes"
import { cn } from "@/lib/utils"

import { usePackagingBreakdown, useQuantityLabel } from "./describe"
import { ItemActions } from "./item-actions"
import { ItemDetailPhoto } from "./item-detail-photo"
import { usePhotoAdder } from "./item-photo-adder"
import { ItemPhotoViewer } from "./item-photo-viewer"
import { ItemPhotos } from "./item-photos"
import { ItemMovementsChart } from "./item-movements-chart"
import { ItemSpecs } from "./item-specs"
import { ItemWarehouseStock } from "./item-warehouse-stock"
import { useItemWarehouses, type WarehouseLine } from "./use-item-warehouses"

/** Onglets à gauche à partir de cette largeur ; en dessous, en ligne au-dessus du contenu. */
const SIDE_TABS_QUERY = "(min-width: 1024px)"

const SECTION_ICONS: Record<ItemSection, LucideIcon> = {
  [ItemSection.general]: InfoIcon,
  [ItemSection.stock]: WarehouseIcon,
  [ItemSection.movements]: HistoryIcon,
}

export function ItemDetailScreen() {
  const t = useTranslations("items")
  const id = useRecordId()
  const item = useItem(id)
  // Relue à l'ouverture : un dépôt vient peut-être d'être ajouté.
  const warehouses = useWarehouses(CatalogStatus.active, { fresh: true })
  const list = { listLabel: t("title"), listHref: Routes.items }

  const state = recordState(id, item, warehouses)
  if (state === RecordState.offline) return <RecordOffline {...list} />
  if (state === RecordState.loading) return <RecordSkeleton />
  if (!item.data) return <RecordNotFound title={t("notFound")} {...list} />
  return <ItemDetails item={item.data} warehouses={warehouses.data ?? []} />
}

/** L'onglet ouvert, gardé dans l'adresse : un lien partagé ou un retour arrière le retrouve. */
function useSection() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const value = searchParams.get(RECORD_SECTION_PARAM)
  const section =
    Object.values(ItemSection).find((candidate) => candidate === value) ??
    ItemSection.general
  const open = (next: ItemSection) => {
    const params = new URLSearchParams(searchParams)
    if (next === ItemSection.general) params.delete(RECORD_SECTION_PARAM)
    else params.set(RECORD_SECTION_PARAM, next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    })
  }
  return [section, open] as const
}

/**
 * Fiche d'un article, en consultation : en tête, sa photo et ce qui le nomme, puis l'essentiel en
 * une ligne (état, stock, dépôts, dernier mouvement). Le détail se range en onglets : la fiche
 * technique, le stock dépôt par dépôt, les mouvements. La modification est un écran à part.
 */
function ItemDetails({
  item,
  warehouses,
}: {
  item: Item
  warehouses: Warehouse[]
}) {
  const t = useTranslations()
  const { can } = useStockAccess()
  const manages = can(StockPermission.manageCatalog)
  const archived = item.status === CatalogStatus.archived
  const stock = useItemStock(item.id)
  const { nodes } = useCategoryTree()
  const category = nodes.find((node) => node.category.id === item.categoryId)
  const summary = useItemWarehouses(item, warehouses, stock.data)
  const [section, openSection] = useSection()
  const sideTabs = useMediaQuery(SIDE_TABS_QUERY)
  const photoAdder = usePhotoAdder(item)
  const adder = manages && !archived ? photoAdder : undefined
  const [photo, openPhoto] = useState<number | null>(null)

  return (
    <PageBody>
      <PageHeader
        title={item.name}
        breadcrumbs={[
          { label: t("items.title"), href: Routes.items },
          { label: item.name },
        ]}
        visual={
          <ItemDetailPhoto
            item={item}
            adder={adder}
            onOpen={() => openPhoto(0)}
          />
        }
        description={
          [item.reference, category?.path].filter(Boolean).join(" · ") ||
          undefined
        }
        badges={
          archived && (
            <Badge variant="secondary">{t("items.restore.badge")}</Badge>
          )
        }
        actions={
          <ItemActions item={item} manages={manages} archived={archived} />
        }
      />

      <KeyFacts item={item} loaded={stock.isSuccess} {...summary} />

      <Tabs
        value={section}
        onValueChange={(next: ItemSection) => openSection(next)}
        orientation={sideTabs ? "vertical" : "horizontal"}
        className="mt-6 gap-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start"
      >
        <TabsList
          variant="line"
          aria-label={t("items.detail.sections")}
          className="w-full justify-start overflow-x-auto border-b pb-px lg:sticky lg:top-20 lg:border-b-0 lg:pb-0"
        >
          {Object.values(ItemSection).map((value) => {
            const Icon = SECTION_ICONS[value]
            return (
              <TabsTrigger
                key={value}
                value={value}
                aria-label={t(`items.detail.section.${value}`)}
                className="h-10 flex-1 rounded-lg px-3 lg:flex-none lg:rounded-xl lg:after:hidden lg:data-active:bg-primary/10 lg:data-active:text-primary"
              >
                <Icon aria-hidden />
                {/* Téléphone : trois onglets tiennent sur la largeur avec leur nom court. */}
                <span className="lg:hidden">
                  {t(`items.detail.sectionShort.${value}`)}
                </span>
                <span className="hidden lg:inline">
                  {t(`items.detail.section.${value}`)}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>
        <TabsContent value={ItemSection.general} className="min-w-0 space-y-6">
          <ItemSpecs item={item} category={category?.path} />
          <StockPreview
            item={item}
            lines={summary.lines}
            loaded={stock.isSuccess}
            onMore={() => openSection(ItemSection.stock)}
          />
          <ItemPhotos item={item} adder={adder} onOpen={openPhoto} />
        </TabsContent>
        <TabsContent value={ItemSection.stock} className="min-w-0">
          <ItemWarehouseStock
            item={item}
            lines={summary.lines}
            warehouses={warehouses}
          />
        </TabsContent>
        <TabsContent
          value={ItemSection.movements}
          className="min-w-0 rounded-2xl border p-4 sm:p-5"
        >
          <ItemMovementsChart itemId={item.id} baseUnit={item.baseUnit} />
          <div className="mt-8">
            <ItemHistory item={item} />
          </div>
        </TabsContent>
      </Tabs>
      <ItemPhotoViewer
        item={item}
        index={photo}
        onIndexChange={openPhoto}
        manages={adder !== undefined}
      />
    </PageBody>
  )
}

/**
 * L'essentiel en une ligne, comme sur toute fiche : où il en est, combien il en reste (aussi en
 * conditionnements), dans combien de dépôts, quand il a bougé, comment on le compte.
 */
function KeyFacts({
  item,
  loaded,
  lines,
  total,
  state,
  alerts,
}: {
  item: Item
  loaded: boolean
  lines: WarehouseLine[]
  total: number
  state: StockState
  alerts: number
}) {
  const t = useTranslations()
  const format = useFormatter()
  const dayAge = useDayAge()
  const quantityLabel = useQuantityLabel()
  const breakdown = usePackagingBreakdown()(item, total)
  const search = useMemo(() => ({ itemId: item.id }), [item.id])
  const latest = useVouchersPage(search, 0, 1)
  const last = latest.data?.items[0]

  if (!loaded) return <Skeleton className="mt-6 h-16 rounded-xl" aria-hidden />
  return (
    <dl
      aria-label={t("items.detail.summary")}
      className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-10"
    >
      <KeyFact icon={CircleGaugeIcon} label={t("items.detail.state")}>
        <StockLevelBadge state={state} quantity={total} />
      </KeyFact>
      <KeyFact
        icon={PackageIcon}
        label={t("items.detail.inStock")}
        hint={breakdown ? t("items.detail.breakdown", { breakdown }) : null}
      >
        <span
          className={cn("num", state === StockState.out && "text-destructive")}
        >
          {quantityLabel(item.baseUnit, total)}
        </span>
      </KeyFact>
      <KeyFact
        icon={WarehouseIcon}
        label={t("items.detail.warehouses")}
        hint={t("items.detail.alerts", { count: alerts })}
      >
        {t("items.preview.warehouses", { count: lines.length })}
      </KeyFact>
      <KeyFact
        icon={ArrowRightLeftIcon}
        label={t("items.detail.lastMovement")}
        hint={last ? dayAge(new Date(last.occurredAt)) : null}
      >
        {last ? (
          <Link
            href={RecordRoutes.voucher(last.id)}
            className="hover:underline"
          >
            {format.dateTime(new Date(last.occurredAt), {
              dateStyle: "medium",
            })}
          </Link>
        ) : latest.isPending && !waitsForNetwork(latest) ? (
          <Skeleton className="mt-1 h-5 w-24" />
        ) : (
          <span className="font-normal text-muted-foreground">
            {/* Hors ligne, l'article vient de la copie du catalogue : ses bons ne sont pas là. */}
            {latest.isPending
              ? t("items.detail.movementOffline")
              : t("items.detail.noMovement")}
          </span>
        )}
      </KeyFact>
      <KeyFact
        icon={RulerIcon}
        label={t("items.detail.unit")}
        hint={item.batchTracking ? t("items.detail.byBatch") : null}
      >
        {t(`units.${item.baseUnit}.label`)}
      </KeyFact>
    </dl>
  )
}

function KeyFact({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: LucideIcon
  label: string
  hint?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-semibold">{children}</dd>
        {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
      </div>
    </div>
  )
}

/** Aperçu du stock dans la fiche générale : une carte par dépôt ; le détail est sous « Stock ». */
function StockPreview({
  item,
  lines,
  loaded,
  onMore,
}: {
  item: Item
  lines: WarehouseLine[]
  loaded: boolean
  onMore: () => void
}) {
  const t = useTranslations("items.detail")
  const quantityLabel = useQuantityLabel()
  return (
    <RecordSection
      id="item-stock-preview-title"
      title={t("byWarehouse")}
      description={t("byWarehouseHint")}
      actions={
        lines.length > 0 && (
          <Button variant="outline" size="sm" onClick={onMore}>
            {t("stockDetail")}
            <ArrowRightIcon />
          </Button>
        )
      }
    >
      {!loaded ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : lines.length === 0 ? (
        <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          {t("noWarehouse")}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {lines.map((line) => (
            <li key={line.warehouse.id} className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate font-medium">
                  {line.warehouse.name}
                </p>
                <StockStateBadge state={line.state} />
              </div>
              <p
                className={cn(
                  "mt-2 num text-xl font-semibold",
                  line.state === StockState.out && "text-destructive"
                )}
              >
                {quantityLabel(item.baseUnit, line.stock?.quantity ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {line.minQuantity === null
                  ? t("noThreshold")
                  : t("threshold", {
                      quantity: quantityLabel(item.baseUnit, line.minQuantity),
                    })}
                {line.maxQuantity !== null &&
                  ` · ${t("maximum", {
                    quantity: quantityLabel(item.baseUnit, line.maxQuantity),
                  })}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </RecordSection>
  )
}

/** Ce qui a bougé : les derniers bons qui portent l'article, avec son mouvement sur chacun. */
function ItemHistory({ item }: { item: Item }) {
  const t = useTranslations("items.detail")
  const quantityLabel = useQuantityLabel()
  const search = useMemo(() => ({ itemId: item.id }), [item.id])
  return (
    <VoucherHistory
      title={t("history")}
      search={search}
      empty={t("noHistory")}
      allHref={`${Routes.vouchers}?${ListQueryParams.item}=${item.id}`}
      detail={(voucher) => {
        const movement = voucher.itemMovement ?? 0
        return (
          <span
            className={cn(
              "num font-semibold",
              movement > 0 && "text-success-muted-foreground"
            )}
          >
            {movement === 0
              ? t("unchanged")
              : `${movement > 0 ? "+" : "−"} ${quantityLabel(item.baseUnit, Math.abs(movement))}`}
          </span>
        )
      }}
    />
  )
}
