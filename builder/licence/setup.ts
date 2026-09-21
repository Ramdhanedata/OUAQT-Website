import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/* not-a-rule: how long a logo link stays good, long enough for one install. */
const LOGO_URL_SECONDS = 60 * 60;

/*
 * Everything the desktop app needs to rearrange itself around one shop.
 *
 * It travels with the licence in a single response, because the computer it
 * is going to may be online for one call on a borrowed hotspot and offline
 * for the rest of the year.
 *
 * The logo goes as two short-lived links rather than as bytes: the response
 * is already the largest thing that shop downloads, and the images are the
 * one part that can be fetched again.
 */
export type Setup = {
  configuration: unknown | null;
  configurationVersion: number | null;
  products: unknown[];
  staff: { name: string; role: string }[];
  logo: { colour: string; mono: string } | null;
};

export async function setupFor(
  supabase: SupabaseClient,
  businessId: string
): Promise<Setup> {
  const [configuration, products, staff, logo] = await Promise.all([
    supabase
      .from("configurations")
      .select("config, version")
      .eq("business_id", businessId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products_initial")
      .select("data")
      .eq("business_id", businessId)
      .order("row_number", { ascending: true }),
    supabase
      .from("staff_initial")
      .select("name, role")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true }),
    supabase
      .from("logos")
      .select("colour_path, mono_path")
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);

  return {
    configuration: configuration.data?.config ?? null,
    configurationVersion: configuration.data?.version ?? null,
    products: (products.data ?? []).map((row) => row.data),
    staff: (staff.data ?? []) as { name: string; role: string }[],
    logo: await signLogo(supabase, logo.data),
  };
}

async function signLogo(
  supabase: SupabaseClient,
  paths: { colour_path: string; mono_path: string } | null
): Promise<{ colour: string; mono: string } | null> {
  if (!paths) return null;

  const [colour, mono] = await Promise.all([
    supabase.storage.from("logos").createSignedUrl(paths.colour_path, LOGO_URL_SECONDS),
    supabase.storage.from("logos").createSignedUrl(paths.mono_path, LOGO_URL_SECONDS),
  ]);

  /*
   * A missing logo is not a reason to refuse an activation. The app draws the
   * shop's name instead, and picks the logo up at the next refresh.
   */
  if (!colour.data?.signedUrl || !mono.data?.signedUrl) return null;
  return { colour: colour.data.signedUrl, mono: mono.data.signedUrl };
}
