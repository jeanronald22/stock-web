import {
  Document,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"

import { PDF_FONT as FONT } from "@/lib/pdf/pdf-fonts"
import { DocumentFooter, Letterhead } from "@/lib/pdf/pdf-letterhead"
import { PdfColors, PdfMetrics } from "@/lib/pdf/pdf-theme"

import {
  SheetTone,
  type ItemSheetPdfData,
  type SheetState,
} from "./item-sheet-pdf-data"

/** Les états du stock gardent leur couleur : elle porte un sens (en stock, bas, rupture). */
const TONES: Record<SheetTone, { background: string; color: string }> = {
  [SheetTone.ok]: { background: "#ECFDF5", color: "#007A55" },
  [SheetTone.low]: { background: "#FFFBEB", color: "#973C00" },
  [SheetTone.out]: { background: "#FEF2F2", color: "#C10007" },
  [SheetTone.empty]: { background: PdfColors.surface, color: PdfColors.muted },
}

const { margin: MARGIN, footerHeight: FOOTER_HEIGHT } = PdfMetrics
const PHOTO = 140
const THUMB = 64
const OTHER_PHOTOS = 4
const BARCODE_WIDTH = 170

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: PdfMetrics.body,
    color: PdfColors.ink,
    padding: MARGIN,
    paddingBottom: MARGIN + FOOTER_HEIGHT,
  },
  hero: { flexDirection: "row", gap: 20, marginTop: 22 },
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: 6,
    objectFit: "cover",
    backgroundColor: PdfColors.surface,
  },
  noPhoto: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: 6,
    backgroundColor: PdfColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1 },
  name: { fontSize: 18, fontWeight: 700, lineHeight: 1.2 },
  category: { color: PdfColors.muted, marginTop: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  pill: {
    fontSize: PdfMetrics.small,
    fontWeight: 600,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
  },
  muted: { color: PdfColors.muted },
  total: { fontSize: 20, fontWeight: 700, marginTop: 12 },
  packs: { color: PdfColors.muted, marginTop: 2 },
  barcode: { marginTop: 12, width: BARCODE_WIDTH },
  barcodeDrawing: { width: BARCODE_WIDTH, height: 34 },
  barcodeDigits: {
    fontSize: PdfMetrics.small,
    letterSpacing: 1.5,
    marginTop: 3,
    textAlign: "center",
  },
  section: { marginTop: 22 },
  sectionTitle: {
    fontSize: PdfMetrics.caption,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingBottom: 5,
    borderBottomWidth: 0.75,
    borderBottomColor: PdfColors.ink,
    marginBottom: 10,
  },
  facts: { flexDirection: "row", flexWrap: "wrap" },
  fact: { width: "33.33%", marginBottom: 12, paddingRight: 12 },
  label: {
    fontSize: PdfMetrics.caption,
    fontWeight: 600,
    letterSpacing: 0.6,
    color: PdfColors.muted,
    textTransform: "uppercase",
  },
  factValue: { fontWeight: 600, marginTop: 3 },
  description: { lineHeight: 1.45 },
  headRow: {
    flexDirection: "row",
    backgroundColor: PdfColors.surface,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: PdfColors.rule,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: PdfColors.ink,
  },
  colWarehouse: { flex: 1, paddingRight: 8 },
  colQuantity: { width: 100, textAlign: "right", paddingRight: 12 },
  colThreshold: { width: 90, textAlign: "right", paddingRight: 12 },
  colState: { width: 80, alignItems: "flex-start" },
  strong: { fontWeight: 600 },
  location: {
    fontSize: PdfMetrics.small,
    color: PdfColors.muted,
    marginTop: 1,
  },
  thumbs: { flexDirection: "row", gap: 10 },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 4,
    objectFit: "cover",
    backgroundColor: PdfColors.surface,
  },
})

function StatePill({ state }: { state: SheetState }) {
  const tone = TONES[state.tone]
  return (
    <Text
      style={[
        styles.pill,
        { backgroundColor: tone.background, color: tone.color },
      ]}
    >
      {state.label}
    </Text>
  )
}

/**
 * Fiches d'articles au format A4, au nom de l'entreprise, une page par article (plus si ses dépôts
 * débordent) : photo et identification, disponibilité par dépôt, autres photos.
 */
export function ItemSheetPdfDocument({ data }: { data: ItemSheetPdfData }) {
  const { labels } = data
  return (
    <Document
      title={
        data.sheets.length === 1
          ? `${labels.title} ${data.sheets[0].reference}`
          : labels.title
      }
      author={data.letterhead.name}
      creator="Kreskala"
      producer="Kreskala"
    >
      {data.sheets.map((sheet) => (
        <Page key={sheet.reference} size="A4" style={styles.page}>
          <Letterhead
            letterhead={data.letterhead}
            title={labels.title}
            number={sheet.reference}
          />

          <View style={styles.hero}>
            {sheet.photo ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, sans attribut alt
              <Image src={sheet.photo} style={styles.photo} />
            ) : (
              <View style={styles.noPhoto}>
                <Text style={styles.muted}>{labels.noPhoto}</Text>
              </View>
            )}
            <View style={styles.heroText}>
              <Text style={styles.name}>{sheet.name}</Text>
              {sheet.category && (
                <Text style={styles.category}>{sheet.category}</Text>
              )}
              <View style={styles.tags}>
                <StatePill state={sheet.state} />
                {sheet.badge && (
                  <StatePill
                    state={{ label: sheet.badge, tone: SheetTone.empty }}
                  />
                )}
              </View>
              <Text style={styles.total}>{sheet.total}</Text>
              {sheet.packs && <Text style={styles.packs}>{sheet.packs}</Text>}
              {sheet.barcode && (
                <View style={styles.barcode} wrap={false}>
                  <Svg
                    style={styles.barcodeDrawing}
                    viewBox={`0 0 ${sheet.barcode.shape.width} ${sheet.barcode.shape.height}`}
                    preserveAspectRatio="none"
                  >
                    {sheet.barcode.shape.paths.map((path, index) => (
                      <Path
                        key={index}
                        d={path.d}
                        stroke={path.stroke}
                        strokeWidth={path.strokeWidth}
                        fill={path.fill ?? "none"}
                      />
                    ))}
                  </Svg>
                  <Text style={styles.barcodeDigits}>{sheet.barcode.code}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.identification}</Text>
            <View style={styles.facts}>
              {sheet.facts.map((fact) => (
                <View key={fact.label} style={styles.fact}>
                  <Text style={styles.label}>{fact.label}</Text>
                  <Text style={styles.factValue}>{fact.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {sheet.description && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>{labels.description}</Text>
              <Text style={styles.description}>{sheet.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.availability}</Text>
            {sheet.warehouses.length === 0 ? (
              <Text style={styles.muted}>{labels.noWarehouse}</Text>
            ) : (
              <>
                <View style={styles.headRow}>
                  <Text style={[styles.label, styles.colWarehouse]}>
                    {labels.warehouse}
                  </Text>
                  <Text style={[styles.label, styles.colQuantity]}>
                    {labels.quantity}
                  </Text>
                  <Text style={[styles.label, styles.colThreshold]}>
                    {labels.threshold}
                  </Text>
                  <Text style={[styles.label, styles.colState]}>
                    {labels.state}
                  </Text>
                </View>
                {sheet.warehouses.map((line) => (
                  <View key={line.name} style={styles.row} wrap={false}>
                    <View style={styles.colWarehouse}>
                      <Text style={styles.strong}>{line.name}</Text>
                      {line.location && (
                        <Text style={styles.location}>
                          {labels.location} {line.location}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.colQuantity, styles.strong]}>
                      {line.quantity}
                    </Text>
                    <Text style={[styles.colThreshold, styles.muted]}>
                      {line.threshold}
                    </Text>
                    <View style={styles.colState}>
                      <StatePill state={line.state} />
                    </View>
                  </View>
                ))}
                <View style={styles.totalRow} wrap={false}>
                  <Text style={[styles.colWarehouse, styles.strong]}>
                    {labels.total}
                  </Text>
                  <Text style={[styles.colQuantity, styles.strong]}>
                    {sheet.total}
                  </Text>
                  <Text style={styles.colThreshold} />
                  <View style={styles.colState} />
                </View>
              </>
            )}
          </View>

          {sheet.otherPhotos.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>{labels.otherPhotos}</Text>
              <View style={styles.thumbs}>
                {sheet.otherPhotos
                  .slice(0, OTHER_PHOTOS)
                  .map((photo, index) => (
                    // eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, sans attribut alt
                    <Image key={index} src={photo} style={styles.thumb} />
                  ))}
              </View>
            </View>
          )}

          <DocumentFooter footer={data.footer} />
        </Page>
      ))}
    </Document>
  )
}
