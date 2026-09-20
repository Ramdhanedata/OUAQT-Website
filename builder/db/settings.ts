import { z } from "zod";
import { supabaseAnonKey, supabaseConfigured, supabaseUrl } from "./env";

/*
 * The settings every page is allowed to read before anyone signs in.
 *
 * Read straight over HTTP rather than through the client library, because
 * that lets Next cache the answer: one request every few minutes for the
 * whole site, not one per visitor. The anon key is used, so the database
 * still decides what may be read. 0003 lists those keys by hand.
 *
 * Nothing in here has a fallback value. A trial length or a price invented in
 * the code is exactly the kind of thing that ends up contradicting the licence
 * a year later, so when the database cannot be reached the caller gets null
 * and leaves the sentence out.
 */

const HOW_OFTEN_TO_REREAD_SECONDS = 300; // not-a-rule: cache lifetime, not a business rule

const rows = z.array(z.object({ key: z.string(), value: z.unknown() }));

const publicSettings = z.object({
  trial_days: z.number().int().positive(),
  max_devices: z.number().int().positive(),
  enabled_packs: z.array(z.string()),
  support_whatsapp: z.string(),
  price_annual_mru: z.number().nullable(),
  price_perpetual_mru: z.number().nullable(),
  price_extra_device_mru: z.number().nullable(),
  tutorial_video_windows_url: z.string(),
  tutorial_video_mac_url: z.string(),
});

export type PublicSettings = z.infer<typeof publicSettings>;

const publicKeys = Object.keys(publicSettings.shape);

/** Every public setting, or null when the database is unreachable or incomplete. */
export async function getPublicSettings(): Promise<PublicSettings | null> {
  if (!supabaseConfigured) return null;

  const url = new URL("/rest/v1/settings", supabaseUrl);
  url.searchParams.set("select", "key,value");
  url.searchParams.set("key", `in.(${publicKeys.join(",")})`);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
      },
      next: { revalidate: HOW_OFTEN_TO_REREAD_SECONDS, tags: ["settings"] },
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const body = rows.safeParse(await response.json());
  if (!body.success) return null;

  const asObject = Object.fromEntries(body.data.map((r) => [r.key, r.value]));
  const parsed = publicSettings.safeParse(asObject);
  return parsed.success ? parsed.data : null;
}

/** Which packs the builder currently opens. Empty when settings are unreadable. */
export async function getEnabledPacks(): Promise<string[]> {
  return (await getPublicSettings())?.enabled_packs ?? [];
}
