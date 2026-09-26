/*
 * Where a download came from, as a mark that cannot be read back.
 *
 * The software opens its shop by itself when it starts on the connection it
 * was downloaded from (see 0024). What we keep to recognise that connection
 * is an HMAC of its public address under a server secret: the same address
 * always gives the same mark, and the mark gives nothing back.
 *
 * An IPv4 address is a whole connection, shared by everything behind the
 * shop's router. An IPv6 address is not: a computer changes the end of it
 * from day to day, and the browser and the software may not even use the
 * same one. The first four groups (the /64) are the network, and that part
 * is the same for both.
 */

/* The first address in X-Forwarded-For, which the host sets and a visitor cannot. */
export function addressFrom(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || null;
}

/* The part of an address that is the same for every device on one connection. */
export function networkOf(address: string): string | null {
  const plain = address.trim().replace(/^\[|\]$/g, "").split("%")[0];
  const mapped = plain.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  if (/^\d+\.\d+\.\d+\.\d+$/.test(plain)) return plain;
  if (!plain.includes(":")) return null;

  const [head, tail] = plain.split("::");
  if (plain.split("::").length > 2) return null;
  const front = head ? head.split(":") : [];
  const back = tail !== undefined && tail ? tail.split(":") : [];
  const missing = 8 - front.length - back.length;
  if (tail === undefined ? front.length !== 8 : missing < 1) return null;
  const groups = [...front, ...Array(tail === undefined ? 0 : missing).fill("0"), ...back];
  if (groups.length !== 8 || !groups.every((group) => /^[0-9a-f]{1,4}$/i.test(group))) return null;
  return groups
    .slice(0, 4)
    .map((group) => group.toLowerCase().replace(/^0+(?=.)/, ""))
    .join(":") + "::/64";
}

/* The mark itself. Null when there is no address or no secret to mark it with. */
export async function placeHash(address: string | null, secret: string): Promise<string | null> {
  if (!address || !secret) return null;
  const network = networkOf(address);
  if (!network) return null;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(`ouaqt-place:${secret}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mark = await crypto.subtle.sign("HMAC", key, encoder.encode(network));
  return Buffer.from(mark).toString("hex");
}
