import "server-only";

/*
 * The token a computer uses to say it is itself.
 *
 * Kept as a hash, like the serial, so a copy of the table is not a set of
 * working credentials. It is handed over once, at activation, and presented
 * on every refresh after that.
 */

export function newDeviceToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return Buffer.from(digest).toString("hex");
}
