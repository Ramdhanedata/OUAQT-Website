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

const money = z.number().nonnegative().nullable();

const publicSettings = z.object({
  trial_days: z.number().int().positive(),
  max_devices: z.number().int().positive(),
  enabled_packs: z.array(z.string()),
  support_whatsapp: z.string(),

  /* The builder track. */
  price_installation_builder_mru: money,
  price_annual_launch_mru: money,
  price_annual_standard_mru: money,
  price_quarterly_standard_mru: money,
  price_setup_visit_mru: money,
  price_extra_device_launch_mru: money,
  price_extra_device_standard_mru: money,

  /* The accompanied track. */
  price_installation_launch_mru: money,
  price_installation_standard_mru: money,
  price_perpetual_launch_mru: money,
  price_perpetual_standard_mru: money,

  /* Bespoke work, and the launch offer. */
  bespoke_maintenance_percent: z.number().nonnegative().nullable(),
  bespoke_maintenance_from_month: z.number().int().positive().nullable(),
  launch_clients_limit: z.number().int().positive().nullable(),
  launch_price_freeze_years: z.number().int().positive().nullable(),
  referral_free_months: z.number().int().nonnegative().nullable(),

  tutorial_video_windows_url: z.string(),
  tutorial_video_mac_url: z.string(),
});

export type PublicSettings = z.infer<typeof publicSettings>;

const publicKeys = Object.keys(publicSettings.shape);

/*
 * A way to run the builder before the database exists.
 *
 * Only consulted when Supabase is not configured at all, so it can never
 * quietly override a real setting in production, where the variable is unset.
 * It is a development convenience and it says so in .env.example.
 */
function developmentSettings(): PublicSettings | null {
  const raw = process.env.BUILDER_DEV_SETTINGS;
  if (!raw) return null;
  try {
    const parsed = publicSettings.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Every public setting, or null when the database is unreachable or incomplete. */
export async function getPublicSettings(): Promise<PublicSettings | null> {
  if (!supabaseConfigured) return developmentSettings();

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

/*
 * A yearly price said the way an owner thinks about it. He does not compare
 * annual licences; he asks what it costs a month.
 */
export function monthlyEquivalent(annual: number): number {
  const MONTHS_IN_A_YEAR = 12; // not-a-rule: a year has twelve months
  return annual / MONTHS_IN_A_YEAR;
}

/** How long the free trial runs, or null when settings cannot be read. */
export async function getTrialDays(): Promise<number | null> {
  return (await getPublicSettings())?.trial_days ?? null;
}
