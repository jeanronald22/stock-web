import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import { PDF_FONT as FONT } from "@/lib/pdf/pdf-fonts"

import type { VoucherPdfData } from "./voucher-pdf-data"

const INK = "#171717"
const MUTED = "#737373"
const RULE = "#d4d4d4"
const BRAND = "#007A55"
const MARGIN = 40
const FOOTER_HEIGHT = 28

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 10,
    color: INK,
    padding: MARGIN,
    paddingBottom: MARGIN + FOOTER_HEIGHT,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: INK,
    paddingBottom: 14,
  },
  organization: { fontSize: 15, fontWeight: 700 },
  muted: { color: MUTED },
  eyebrow: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 1,
    color: MUTED,
    textTransform: "uppercase",
    textAlign: "right",
  },
  number: { fontSize: 18, fontWeight: 700, textAlign: "right", marginTop: 3 },
  facts: { flexDirection: "row", flexWrap: "wrap", marginTop: 18 },
  fact: { width: "50%", marginBottom: 10 },
  factLabel: { fontSize: 8, color: MUTED },
  factValue: { fontWeight: 600, marginTop: 2 },
  table: { marginTop: 14 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    paddingVertical: 7,
  },
  headRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    paddingBottom: 6,
  },
  head: { fontSize: 8, color: MUTED },
  colIndex: { width: 22 },
  colItem: { flex: 1, paddingRight: 8 },
  colBatch: { width: 70, paddingRight: 8 },
  colEntered: { width: 90, paddingRight: 8 },
  colQuantity: { width: 90, textAlign: "right" },
  itemName: { fontWeight: 600 },
  reference: { fontSize: 8, color: MUTED, marginTop: 1 },
  lineCount: { marginTop: 8, textAlign: "right", color: MUTED },
  note: {
    marginTop: 16,
    borderWidth: 0.5,
    borderColor: RULE,
    borderRadius: 6,
    padding: 10,
  },
  signatures: { flexDirection: "row", marginTop: 32, gap: 24 },
  signature: { flex: 1 },
  signatureName: { fontWeight: 600, minHeight: 14, marginTop: 2 },
  signatureBox: {
    marginTop: 6,
    height: 64,
    borderWidth: 0.75,
    borderStyle: "dashed",
    borderColor: MUTED,
    borderRadius: 6,
  },
  footer: {
    position: "absolute",
    left: MARGIN,
    right: MARGIN,
    bottom: MARGIN / 2,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: RULE,
    paddingTop: 6,
    fontSize: 8,
    color: MUTED,
  },
  brand: { color: BRAND, fontWeight: 700 },
})

/**
 * Bon au format A4. Le pied de page est fixe : il se répète en bas de chaque page ; les cases de
 * signature restent ensemble, sur la dernière page.
 */
export function VoucherPdfDocument({ data }: { data: VoucherPdfData }) {
  return (
    <Document
      title={`${data.title} ${data.number}`}
      author={data.organization.name}
      creator="Kreskala"
      producer="Kreskala"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.organization}>{data.organization.name}</Text>
            <Text style={styles.muted}>{data.organization.city}</Text>
          </View>
          <View>
            <Text style={styles.eyebrow}>{data.title}</Text>
            <Text style={styles.number}>{data.number}</Text>
          </View>
        </View>

        <View style={styles.facts}>
          {data.facts.map((fact) => (
            <View key={fact.label} style={styles.fact}>
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.table}>
          <View style={styles.headRow}>
            <Text style={[styles.head, styles.colIndex]}>#</Text>
            <Text style={[styles.head, styles.colItem]}>
              {data.columns.item}
            </Text>
            <Text style={[styles.head, styles.colBatch]}>
              {data.columns.batch}
            </Text>
            <Text style={[styles.head, styles.colEntered]}>
              {data.columns.entered}
            </Text>
            <Text style={[styles.head, styles.colQuantity]}>
              {data.columns.quantity}
            </Text>
          </View>
          {data.lines.map((line, index) => (
            <View key={`${line.name}-${index}`} style={styles.row} wrap={false}>
              <Text style={[styles.colIndex, styles.muted]}>{index + 1}</Text>
              <View style={styles.colItem}>
                <Text style={styles.itemName}>{line.name}</Text>
                {line.reference && (
                  <Text style={styles.reference}>{line.reference}</Text>
                )}
              </View>
              <Text style={styles.colBatch}>{line.batch}</Text>
              <Text style={styles.colEntered}>{line.entered}</Text>
              <Text style={[styles.colQuantity, styles.itemName]}>
                {line.quantity}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.lineCount}>{data.lineCount}</Text>

        {data.note && (
          <View style={styles.note} wrap={false}>
            <Text style={styles.factLabel}>{data.note.label}</Text>
            <Text style={{ marginTop: 3 }}>{data.note.text}</Text>
          </View>
        )}

        <View style={styles.signatures} wrap={false}>
          {data.signatures.map((signature) => (
            <View key={signature.label} style={styles.signature}>
              <Text style={styles.factLabel}>{signature.label}</Text>
              <Text style={styles.signatureName}>{signature.name}</Text>
              <View style={styles.signatureBox} />
            </View>
          ))}
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
    </Document>
  )
}
