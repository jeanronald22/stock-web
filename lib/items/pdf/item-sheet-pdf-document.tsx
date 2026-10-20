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

import {
  SheetTone,
  type ItemSheetPdfData,
  type SheetState,
} from "./item-sheet-pdf-data"

/** Couleurs de la charte (app/globals.css), en hexadécimal : le PDF ne lit pas les variables CSS. */
const BRAND = "#007A55"
const BRAND_SOFT = "#ECFDF5"
const MINT = "#5EE9B5"
const INK = "#171717"
const MUTED = "#737373"
const RULE = "#E5E5E5"
const SURFACE = "#F5F5F5"
const WHITE = "#FFFFFF"
const TONES: Record<SheetTone, { background: string; color: string }> = {
  [SheetTone.ok]: { background: BRAND_SOFT, color: BRAND },
  [SheetTone.low]: { background: "#FFFBEB", color: "#973C00" },
  [SheetTone.out]: { background: "#FEF2F2", color: "#C10007" },
  [SheetTone.empty]: { background: SURFACE, color: MUTED },
}

const MARGIN = 36
const BAND_HEIGHT = 64
/** Logo blanc 784 × 192 (public/brand/png). */
const LOGO_HEIGHT = 24
const LOGO_WIDTH = (LOGO_HEIGHT * 784) / 192
const PHOTO = 150
const THUMB = 64
const FOOTER_HEIGHT = 30
const OTHER_PHOTOS = 4

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 10,
    color: INK,
    paddingBottom: MARGIN + FOOTER_HEIGHT,
  },
  band: {
    height: BAND_HEIGHT,
    backgroundColor: BRAND,
    paddingHorizontal: MARGIN,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
  organization: {
    color: WHITE,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "right",
  },
  city: { color: MINT, fontSize: 9, textAlign: "right", marginTop: 2 },
  body: { paddingHorizontal: MARGIN, paddingTop: 24 },
  eyebrow: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: BRAND,
    textTransform: "uppercase",
  },
  hero: { flexDirection: "row", gap: 20, marginTop: 10 },
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: 10,
    objectFit: "cover",
    backgroundColor: SURFACE,
  },
  noPhoto: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: 10,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1, justifyContent: "center" },
  name: { fontSize: 20, fontWeight: 700, lineHeight: 1.2 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  pill: {
    fontSize: 9,
    fontWeight: 600,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
  },
  muted: { color: MUTED },
  category: { color: MUTED, marginTop: 6 },
  total: { fontSize: 22, fontWeight: 700, marginTop: 10 },
  packs: { color: MUTED, marginTop: 2 },
  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: BRAND,
    textTransform: "uppercase",
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND,
    marginBottom: 10,
  },
  facts: { flexDirection: "row", flexWrap: "wrap" },
  fact: { width: "50%", marginBottom: 10, paddingRight: 12 },
  factLabel: { fontSize: 8, color: MUTED },
  factValue: { fontWeight: 600, marginTop: 2 },
  barcode: { marginTop: 12, width: 170 },
  barcodeDrawing: { width: 170, height: 36 },
  barcodeDigits: { fontSize: 9, letterSpacing: 1.5, marginTop: 3 },
  description: { lineHeight: 1.45 },
  headRow: {
    flexDirection: "row",
    backgroundColor: SURFACE,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  head: { fontSize: 8, color: MUTED, fontWeight: 600 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1.5,
    borderTopColor: BRAND,
  },
  colWarehouse: { flex: 1, paddingRight: 8 },
  colQuantity: { width: 100, textAlign: "right", paddingRight: 12 },
  colThreshold: { width: 90, textAlign: "right", paddingRight: 12 },
  colState: { width: 80, alignItems: "flex-start" },
  strong: { fontWeight: 600 },
  location: { fontSize: 8, color: MUTED, marginTop: 1 },
  thumbs: { flexDirection: "row", gap: 10 },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
    objectFit: "cover",
    backgroundColor: SURFACE,
  },
  footer: {
    position: "absolute",
    left: MARGIN,
    right: MARGIN,
    bottom: MARGIN / 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: RULE,
    paddingTop: 8,
    fontSize: 8,
    color: MUTED,
  },
  brand: { color: BRAND, fontWeight: 700, fontSize: 9 },
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
 * Fiches d'articles au format A4, une page par article (plus si ses dépôts débordent) : bandeau aux
 * couleurs de Kreskala, photo et identification, disponibilité par dépôt, autres photos. Le
 * bandeau n'est pas répété sur une page de suite : il couvrirait le texte, qui part du haut.
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
      author={data.organization.name}
      creator="Kreskala"
      producer="Kreskala"
    >
      {data.sheets.map((sheet) => (
        <Page key={sheet.reference} size="A4" style={styles.page}>
          <View style={styles.band}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, sans attribut alt */}
            <Image src={data.logo} style={styles.logo} />
            <View>
              <Text style={styles.organization}>{data.organization.name}</Text>
              <Text style={styles.city}>{data.organization.city}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.eyebrow}>{labels.title}</Text>
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
                <View style={styles.tags}>
                  <Text
                    style={[
                      styles.pill,
                      { backgroundColor: BRAND, color: WHITE },
                    ]}
                  >
                    {sheet.reference}
                  </Text>
                  <StatePill state={sheet.state} />
                  {sheet.badge && (
                    <StatePill
                      state={{ label: sheet.badge, tone: SheetTone.empty }}
                    />
                  )}
                </View>
                {sheet.category && (
                  <Text style={styles.category}>{sheet.category}</Text>
                )}
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
                    <Text style={styles.barcodeDigits}>
                      {sheet.barcode.code}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{labels.identification}</Text>
              <View style={styles.facts}>
                {sheet.facts.map((fact) => (
                  <View key={fact.label} style={styles.fact}>
                    <Text style={styles.factLabel}>{fact.label}</Text>
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
                    <Text style={[styles.head, styles.colWarehouse]}>
                      {labels.warehouse}
                    </Text>
                    <Text style={[styles.head, styles.colQuantity]}>
                      {labels.quantity}
                    </Text>
                    <Text style={[styles.head, styles.colThreshold]}>
                      {labels.threshold}
                    </Text>
                    <Text style={[styles.head, styles.colState]}>
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
          </View>

          <View style={styles.footer} fixed>
            <Text>{data.footer}</Text>
            <Text
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
            <Text style={styles.brand}>kreskala</Text>
          </View>
        </Page>
      ))}
    </Document>
  )
}
