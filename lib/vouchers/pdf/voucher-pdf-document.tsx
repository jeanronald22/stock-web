import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import { PDF_FONT as FONT } from "@/lib/pdf/pdf-fonts"
import { DocumentFooter, Letterhead } from "@/lib/pdf/pdf-letterhead"
import { PdfColors, PdfMetrics } from "@/lib/pdf/pdf-theme"

import type { VoucherPdfData } from "./voucher-pdf-data"

const { margin: MARGIN, footerHeight: FOOTER_HEIGHT } = PdfMetrics

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: PdfMetrics.body,
    color: PdfColors.ink,
    padding: MARGIN,
    paddingBottom: MARGIN + FOOTER_HEIGHT,
  },
  muted: { color: PdfColors.muted },
  facts: { flexDirection: "row", flexWrap: "wrap", marginTop: 18 },
  fact: { width: "33.33%", marginBottom: 12, paddingRight: 12 },
  label: {
    fontSize: PdfMetrics.caption,
    fontWeight: 600,
    letterSpacing: 0.6,
    color: PdfColors.muted,
    textTransform: "uppercase",
  },
  factValue: { fontWeight: 600, marginTop: 3 },
  table: { marginTop: 8 },
  headRow: {
    flexDirection: "row",
    backgroundColor: PdfColors.surface,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: PdfColors.rule,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colIndex: { width: 20 },
  colItem: { flex: 1, paddingRight: 10 },
  colBatch: { width: 70, paddingRight: 10 },
  colEntered: { width: 85, paddingRight: 10 },
  colQuantity: { width: 95, textAlign: "right" },
  strong: { fontWeight: 600 },
  detail: { fontSize: PdfMetrics.small, color: PdfColors.muted, marginTop: 2 },
  lineCount: {
    marginTop: 8,
    paddingRight: 8,
    textAlign: "right",
    fontSize: PdfMetrics.small,
    color: PdfColors.muted,
  },
  note: {
    marginTop: 16,
    borderLeftWidth: 2,
    borderLeftColor: PdfColors.ink,
    backgroundColor: PdfColors.surface,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  noteText: { marginTop: 4, lineHeight: 1.4 },
  signatures: { flexDirection: "row", marginTop: 32, gap: 16 },
  signature: { flex: 1 },
  signatureName: { fontWeight: 600, minHeight: 13, marginTop: 3 },
  signatureBox: {
    marginTop: 6,
    height: 64,
    borderWidth: 0.75,
    borderColor: PdfColors.rule,
    borderRadius: 4,
  },
})

/**
 * Bon au format A4, au nom de l'entreprise. Le pied de page se répète en bas de chaque page ; les
 * cases de signature restent ensemble, sur la dernière.
 */
export function VoucherPdfDocument({ data }: { data: VoucherPdfData }) {
  return (
    <Document
      title={`${data.title} ${data.number}`}
      author={data.letterhead.name}
      creator="Kreskala"
      producer="Kreskala"
    >
      <Page size="A4" style={styles.page}>
        <Letterhead
          letterhead={data.letterhead}
          title={data.title}
          number={data.number}
        />

        <View style={styles.facts}>
          {data.facts.map((fact) => (
            <View key={fact.label} style={styles.fact}>
              <Text style={styles.label}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.table}>
          <View style={styles.headRow}>
            <Text style={[styles.label, styles.colIndex]}>#</Text>
            <Text style={[styles.label, styles.colItem]}>
              {data.columns.item}
            </Text>
            <Text style={[styles.label, styles.colBatch]}>
              {data.columns.batch}
            </Text>
            <Text style={[styles.label, styles.colEntered]}>
              {data.columns.entered}
            </Text>
            <Text style={[styles.label, styles.colQuantity]}>
              {data.columns.quantity}
            </Text>
          </View>
          {data.lines.map((line, index) => (
            <View key={`${line.name}-${index}`} style={styles.row} wrap={false}>
              <Text style={[styles.colIndex, styles.muted]}>{index + 1}</Text>
              <View style={styles.colItem}>
                <Text style={styles.strong}>{line.name}</Text>
                {line.reference && (
                  <Text style={styles.detail}>{line.reference}</Text>
                )}
                {line.location && (
                  <Text style={styles.detail}>{line.location}</Text>
                )}
              </View>
              <Text style={styles.colBatch}>{line.batch}</Text>
              <Text style={styles.colEntered}>{line.entered}</Text>
              <Text style={[styles.colQuantity, styles.strong]}>
                {line.quantity}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.lineCount}>{data.lineCount}</Text>

        {data.note && (
          <View style={styles.note} wrap={false}>
            <Text style={styles.label}>{data.note.label}</Text>
            <Text style={styles.noteText}>{data.note.text}</Text>
          </View>
        )}

        <View style={styles.signatures} wrap={false}>
          {data.signatures.map((signature) => (
            <View key={signature.label} style={styles.signature}>
              <Text style={styles.label}>{signature.label}</Text>
              <Text style={styles.signatureName}>{signature.name}</Text>
              <View style={styles.signatureBox} />
            </View>
          ))}
        </View>

        <DocumentFooter footer={data.footer} />
      </Page>
    </Document>
  )
}
