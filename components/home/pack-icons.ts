import type { Pack } from "@/app-ui/packs";
import { BedDouble, Bus, Croissant, LayoutGrid, Pill, ShoppingBasket, UtensilsCrossed, Warehouse, type LucideIcon } from "lucide-react";

/* One picture per trade, the same in the trade list and the demo's tabs. */
export const packIcons: Record<Pack, LucideIcon> = {
  pharmacy: Pill,
  bakery: Croissant,
  restaurant: UtensilsCrossed,
  warehouse: Warehouse,
  shop: ShoppingBasket,
  hotel: BedDouble,
  transport: Bus,
  general: LayoutGrid,
};
