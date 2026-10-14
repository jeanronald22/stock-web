import {
  HardHatIcon,
  StoreIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"

import type { WarehouseKind } from "@/lib/api/stock"

export const warehouseKindIcons: Record<WarehouseKind, LucideIcon> = {
  SHOP: StoreIcon,
  WAREHOUSE: WarehouseIcon,
  SITE: HardHatIcon,
}
