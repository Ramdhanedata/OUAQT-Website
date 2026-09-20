import "server-only";

/*
 * The serial is stored twice, and neither copy is readable by accident.
 *
 * `serial_hash` is a one way digest, which is what a lookup compares against.
 * `serial_cipher` is the serial itself under AES-GCM, so the owner's account
 * can show him his own number months later. Anyone reading the table sees
 * neither.
 *
 * The key lives in SERIAL_SECRET and nowhere else. Change it and every
 * existing serial becomes unreadable, which is why it belongs in the launch
 * checklist rather than in a hurry.
 *
 * not-a-rule-file: the sizes below are cryptographic parameters.
 */

const IV_BYTES = 12; // AES-GCM's own nonce size

async function key(): Promise<CryptoKey> {
  const secret = (process.env.SERIAL_SECRET ?? "").trim();
  if (secret.length < 32) {
    throw new Error(
      "SERIAL_SECRET is missing or too short. Generate one with: openssl rand -hex 32"
    );
  }

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret)
  );
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export function serialSecretIsSet(): boolean {
  return (process.env.SERIAL_SECRET ?? "").trim().length >= 32;
}

/** The serial, encrypted. The nonce travels with it, which is normal and safe. */
export async function encryptSerial(serial: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const sealed = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(),
    new TextEncoder().encode(serial)
  );

  return `${base64(iv)}.${base64(new Uint8Array(sealed))}`;
}

export async function decryptSerial(stored: string): Promise<string | null> {
  const [head, body] = stored.split(".");
  if (!head || !body) return null;

  try {
    const opened = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes(head) },
      await key(),
      bytes(body)
    );
    return new TextDecoder().decode(opened);
  } catch {
    // A wrong key, or a row written under an older one. Not a crash: the
    // account area simply cannot show that serial.
    return null;
  }
}

function base64(input: Uint8Array): string {
  return Buffer.from(input).toString("base64url");
}

function bytes(input: string): Uint8Array<ArrayBuffer> {
  const decoded = Buffer.from(input, "base64url");
  // Copied into its own ArrayBuffer: a Buffer is a view on a shared pool, and
  // WebCrypto will not take one of those.
  const out = new Uint8Array(new ArrayBuffer(decoded.length));
  out.set(decoded);
  return out;
}
