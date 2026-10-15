"use client"

import { useEffect, useState } from "react"

import type { Item } from "@/lib/api/stock"
import { drawBarcode } from "@/lib/labels/barcode"
import type { LabelFormat } from "@/lib/labels/label-formats"

/** Aperçu d'une étiquette à l'écran, aux proportions du format choisi. */
export function LabelPreview({
  item,
  format,
}: {
  item: Item & { barcode: string }
  format: LabelFormat
}) {
  const [drawn, setDrawn] = useState<{ code: string; svg: string } | null>(null)
  useEffect(() => {
    let current = true
    void drawBarcode(item.barcode).then((shape) => {
      if (current) setDrawn({ code: item.barcode, svg: shape.svg })
    })
    return () => {
      current = false
    }
  }, [item.barcode])
  const svg = drawn?.code === item.barcode ? drawn.svg : null

  return (
    <div
      className="mx-auto flex w-full max-w-72 flex-col rounded-md border bg-white p-[4%] text-black shadow-sm"
      style={{ aspectRatio: `${format.label.width} / ${format.label.height}` }}
      aria-hidden
    >
      <p className="line-clamp-2 text-[13px] leading-tight font-semibold">
        {item.name}
      </p>
      {item.reference && (
        <p className="truncate text-[11px] text-neutral-600">
          {item.reference}
        </p>
      )}
      <div className="mt-1 min-h-0 flex-1">
        {svg && (
          // eslint-disable-next-line @next/next/no-img-element -- dessin généré sur place, pas une image à optimiser
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
            alt=""
            className="size-full object-fill"
          />
        )}
      </div>
      <p className="text-center text-[11px] tracking-wider">{item.barcode}</p>
    </div>
  )
}
