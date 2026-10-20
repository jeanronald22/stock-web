import {
  Document,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"

import { PDF_FONT } from "@/lib/pdf/pdf-fonts"

import type { BarcodeShape } from "./barcode"
import { labelsPerPage, PT_PER_MM, type LabelFormat } from "./label-formats"

/** Une étiquette : l'article et son code dessiné. */
export type LabelData = {
  name: string
  reference: string | null
  code: string
  shape: BarcodeShape
}

const INK = "#000000"
const MUTED = "#404040"
/** Marge intérieure : la zone blanche que les lecteurs demandent de part et d'autre des barres. */
const PADDING_MM = 3
/** Taille des textes secondaires, rapportée à celle du nom. */
const SMALL_RATIO = 0.8
const DIGITS_LETTER_SPACING = 0.6
const LINE_HEIGHT = 1.2
/** Écarts entre le nom, la référence, les barres et les chiffres : rien ne se touche. */
const GAP_MM = 0.8

const mm = (value: number) => value * PT_PER_MM

const styles = StyleSheet.create({
  page: { fontFamily: PDF_FONT, color: INK },
  label: {
    position: "absolute",
    padding: mm(PADDING_MM),
    flexDirection: "column",
  },
  // Un nom trop long tient en deux lignes, terminées par des points de suspension.
  name: {
    fontWeight: 600,
    lineHeight: LINE_HEIGHT,
    maxLines: 2,
    textOverflow: "ellipsis",
  },
  reference: {
    color: MUTED,
    marginTop: mm(GAP_MM * 1.5),
    maxLines: 1,
    textOverflow: "ellipsis",
  },
  barcode: { flexGrow: 1, marginTop: mm(GAP_MM * 2) },
  digits: {
    textAlign: "center",
    letterSpacing: DIGITS_LETTER_SPACING,
    marginTop: mm(GAP_MM),
  },
})

/**
 * Étiquettes à imprimer (D36). [skip] : emplacements déjà utilisés en haut de la première planche,
 * laissés vides.
 */
export function LabelPdfDocument({
  labels,
  format,
  skip,
  title,
}: {
  labels: LabelData[]
  format: LabelFormat
  skip: number
  title: string
}) {
  const perPage = labelsPerPage(format)
  const slots: (LabelData | null)[] = [
    ...Array.from({ length: format.sheet ? skip : 0 }, () => null),
    ...labels,
  ]
  const pages = Array.from(
    { length: Math.ceil(slots.length / perPage) },
    (_, index) => slots.slice(index * perPage, (index + 1) * perPage)
  )
  const small = format.nameSize * SMALL_RATIO
  return (
    <Document title={title}>
      {pages.map((page, pageIndex) => (
        <Page
          key={pageIndex}
          size={[mm(format.page.width), mm(format.page.height)]}
          style={styles.page}
        >
          {page.map((label, index) =>
            label ? (
              <View
                key={index}
                style={[
                  styles.label,
                  {
                    left: mm(
                      format.margin.left +
                        (index % format.columns) * format.label.width
                    ),
                    top: mm(
                      format.margin.top +
                        Math.floor(index / format.columns) * format.label.height
                    ),
                    width: mm(format.label.width),
                    height: mm(format.label.height),
                  },
                ]}
              >
                <Text style={[styles.name, { fontSize: format.nameSize }]}>
                  {label.name}
                </Text>
                {label.reference && (
                  <Text style={[styles.reference, { fontSize: small }]}>
                    {label.reference}
                  </Text>
                )}
                <Svg
                  style={styles.barcode}
                  viewBox={`0 0 ${label.shape.width} ${label.shape.height}`}
                  preserveAspectRatio="none"
                >
                  {label.shape.paths.map((path, pathIndex) => (
                    <Path
                      key={pathIndex}
                      d={path.d}
                      stroke={path.stroke}
                      strokeWidth={path.strokeWidth}
                      fill={path.fill ?? "none"}
                    />
                  ))}
                </Svg>
                <Text style={[styles.digits, { fontSize: small }]}>
                  {label.code}
                </Text>
              </View>
            ) : null
          )}
        </Page>
      ))}
    </Document>
  )
}
