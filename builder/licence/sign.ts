import "server-only";

import { encodePayload, type LicencePayload, type SignedLicence } from "@/app-ui/licence-file";

/*
 * Signing, which happens here and nowhere else.
 *
 * The private key lives in LICENCE_SIGNING_KEY and is never sent anywhere.
 * The public half is built into the desktop app, so a shop can check a
 * licence with no network at all.
 *
 * Generate a pair with: npm run licence:keys
 */

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const decoded = Buffer.from(text, "base64url");
  // Copied out of Node's shared pool: WebCrypto will not take a view on it.
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));
  bytes.set(decoded);
  return bytes;
}

function toBase64Url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

export function signingKeyIsSet(): boolean {
  return (process.env.LICENCE_SIGNING_KEY ?? "").trim().length > 0;
}

export async function signLicence(payload: LicencePayload): Promise<SignedLicence> {
  const secret = (process.env.LICENCE_SIGNING_KEY ?? "").trim();
  if (!secret) {
    throw new Error(
      "LICENCE_SIGNING_KEY is not set. Generate one with: npm run licence:keys"
    );
  }

  const key = await crypto.subtle.importKey(
    "pkcs8",
    fromBase64Url(secret),
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  const body = encodePayload(payload);
  const signature = await crypto.subtle.sign(
    { name: "Ed25519" },
    key,
    new TextEncoder().encode(body)
  );

  return `${body}.${toBase64Url(signature)}`;
}
