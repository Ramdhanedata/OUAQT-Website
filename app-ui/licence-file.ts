/*
 * The licence file the desktop app runs on.
 *
 * It is signed with Ed25519 and verified with a public key built into the
 * app, so a shop with no signal can still tell a real licence from an edited
 * one. Everything the app needs to behave correctly offline is inside it:
 * not only when the licence ends, but how long the grace is afterwards, how
 * much clock drift to tolerate, and how many computers are allowed.
 *
 * That last point is the reason this file exists in the shape it does. An app
 * that has to ask a server what the rules are is an app that stops working
 * when the network does.
 *
 * The verifier is pure and lives here because the desktop app imports it.
 * Nothing in this file touches a network, a database or a screen.
 */

export type LicenceDevice = {
  deviceId: string;
  role: "main" | "secondary";
};

export type LicencePayload = {
  version: 1;
  businessId: string;
  /** What the shop is called, so the app can show it before it has any data. */
  businessName: string;
  plan: "trial" | "annual" | "perpetual" | "extra_device";
  status: "trial" | "active" | "expired_trial" | "renewal_due" | "expired" | "suspended";
  /** ISO dates, or null where the plan has none. */
  startsAt: string | null;
  endsAt: string | null;
  updatesUntil: string | null;
  /* The rules, delivered rather than assumed. All from settings. */
  maxDevices: number;
  renewalGraceDays: number;
  clockGraceDays: number;
  deviceReleasesPerYear: number;
  devices: LicenceDevice[];
  /*
   * The secret this licence's renewal codes are checked against.
   *
   * It has to be here, because checking a code offline means holding the
   * material to check it with, and offline is the whole point: the shutter is
   * down, there is no signal, and the owner is reading ten characters off a
   * WhatsApp message.
   *
   * What that costs: an owner who digs this out of his own licence file could
   * mint himself a renewal code. What it does not cost: anything lasting. The
   * server's dates win at the next refresh, so a forged extension survives
   * exactly as long as the shop stays offline, and the attempt is visible
   * because no matching code was ever generated here.
   */
  renewalSecret: string;
  /** When this file was made, and when the app should ask for a fresh one. */
  issuedAt: string;
  refreshAfter: string;
};

export type SignedLicence = string;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  // Its own ArrayBuffer, because WebCrypto will not take a view on a shared one.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodePayload(payload: LicencePayload): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

/** Reads the payload without checking it. Never use this to decide anything. */
export function peek(signed: SignedLicence): LicencePayload | null {
  try {
    const [body] = signed.split(".");
    return JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as LicencePayload;
  } catch {
    return null;
  }
}

/**
 * Checks the signature and gives back the licence, or null.
 *
 * Null means one thing to the app: behave as though there is no licence. It
 * does not mean ask again, and it does not mean try without one.
 */
export async function verifyLicence(
  signed: SignedLicence,
  publicKeySpki: string
): Promise<LicencePayload | null> {
  const [body, signature] = signed.split(".");
  if (!body || !signature) return null;

  try {
    const key = await crypto.subtle.importKey(
      "spki",
      fromBase64Url(publicKeySpki),
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const ok = await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(body)
    );
    if (!ok) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body))
    ) as LicencePayload;

    return payload.version === 1 ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Whether this computer is one the licence covers.
 *
 * Checked by the app on every start, because a licence file copied onto a
 * third machine is the ordinary way a two device limit gets tested.
 */
export function coversDevice(payload: LicencePayload, deviceId: string): boolean {
  return payload.devices.some((device) => device.deviceId === deviceId);
}
