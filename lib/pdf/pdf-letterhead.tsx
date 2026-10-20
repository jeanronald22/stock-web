import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { PdfPicture } from "./pdf-image"
import { PdfColors, PdfMetrics } from "./pdf-theme"

/** L'entreprise telle qu'elle signe ses documents : logo, nom, coordonnées déjà mises en forme. */
export type PdfLetterhead = {
  name: string
  logo: PdfPicture | null
  /** « Rue Joss, Akwa · Douala », « Tél. +237 6 99 12 34 56 », « RCCM … · NIU … ». */
  lines: string[]
}

/** Pied de chaque page : une précision sur le document, et la mention de l'outil qui l'a édité. */
export type PdfFooter = { note: string; credit: string }

/** Cadre du logo : il garde ses proportions, carré ou en longueur, sans jamais déborder. */
const LOGO_MAX_HEIGHT = 52
const LOGO_MAX_WIDTH = 190

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
  },
  identity: { flexShrink: 1, maxWidth: "62%" },
  logo: { marginBottom: 8 },
  name: { fontSize: 11, fontWeight: 700 },
  /** Sans logo, le nom tient sa place. */
  nameAlone: { fontSize: 17, fontWeight: 700, lineHeight: 1.2 },
  line: {
    fontSize: PdfMetrics.small,
    color: PdfColors.muted,
    marginTop: 2,
    lineHeight: 1.35,
  },
  document: { alignItems: "flex-end", flexShrink: 0, paddingTop: 2 },
  title: {
    fontSize: PdfMetrics.caption,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: PdfColors.muted,
    textTransform: "uppercase",
    textAlign: "right",
  },
  number: {
    fontSize: 17,
    fontWeight: 700,
    textAlign: "right",
    marginTop: 4,
  },
  rule: { height: 0.75, backgroundColor: PdfColors.rule, marginTop: 16 },
  footer: {
    position: "absolute",
    left: PdfMetrics.margin,
    right: PdfMetrics.margin,
    bottom: PdfMetrics.margin / 2,
    flexDirection: "row",
    alignItems: "center",
    fontSize: PdfMetrics.caption,
    color: PdfColors.muted,
  },
  footerNote: { flex: 1 },
  footerPage: { width: 60, textAlign: "center" },
  footerCredit: { flex: 1, textAlign: "right", color: PdfColors.faint },
})

function logoSize(logo: PdfPicture) {
  const scale = Math.min(
    LOGO_MAX_HEIGHT / logo.height,
    LOGO_MAX_WIDTH / logo.width
  )
  return { width: logo.width * scale, height: logo.height * scale }
}

/**
 * En-tête d'un document A4 : l'entreprise à gauche, logo d'abord ; à droite, la nature du document
 * et son numéro. Un filet clair le sépare du contenu : le seul trait du document hors tableaux.
 */
export function Letterhead({
  letterhead,
  title,
  number,
}: {
  letterhead: PdfLetterhead
  title: string
  number: string
}) {
  const { logo } = letterhead
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.identity}>
          {logo && (
            // eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, sans attribut alt
            <Image src={logo.src} style={[styles.logo, logoSize(logo)]} />
          )}
          <Text style={logo ? styles.name : styles.nameAlone}>
            {letterhead.name}
          </Text>
          {letterhead.lines.map((line) => (
            <Text key={line} style={styles.line}>
              {line}
            </Text>
          ))}
        </View>
        <View style={styles.document}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.number}>{number}</Text>
        </View>
      </View>
      <View style={styles.rule} />
    </View>
  )
}

/** Pied de page répété en bas de chaque page (fixed) : précision, pagination, mention de l'outil. */
export function DocumentFooter({ footer }: { footer: PdfFooter }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerNote}>{footer.note}</Text>
      <Text
        style={styles.footerPage}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
      <Text style={styles.footerCredit}>{footer.credit}</Text>
    </View>
  )
}
