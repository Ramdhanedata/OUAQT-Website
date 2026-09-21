/*
 * The screens the desktop app and the builder's preview share.
 *
 * Nothing in this folder may import Next.js, Supabase or browser storage.
 * Everything arrives as props, so the same component renders inside the
 * website and inside the Electron app without knowing which it is in.
 */
export * from "./packs";
export * from "./config";
export * from "./copy";
export * from "./format";
export * from "./money";
export * from "./sample-data";
export { Receipt, RECEIPT_WIDTH, type ReceiptLine } from "./receipt";
export { SaleScreen } from "./sale-screen";
export { Tables, type TableState } from "./tables";
export { KitchenTicket, type KitchenLine } from "./kitchen-ticket";
export { Production, type ProductionRow, type Preorder } from "./production";
export { StockMoves, type Movement } from "./stock-moves";
export { Scaled } from "./scaled";
