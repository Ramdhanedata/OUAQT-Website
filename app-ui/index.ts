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
export * from "./licence-status";
export * from "./licence-file";
export * from "./sample-data";
export { Receipt, RECEIPT_WIDTH, type ReceiptLine } from "./receipt";
export { Scaled } from "./scaled";
