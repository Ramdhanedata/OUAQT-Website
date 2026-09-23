import "server-only";

import { z } from "zod";
import { adminClient } from "./server";

/*
 * The settings a visitor may not read.
 *
 * 0003 lists what anyone can see. These are the rest: the number owners pay
 * to, and the windows and limits the desktop app and the payment checks
 * enforce. They are read here, with the service role, in server code only.
 *
 * Kept apart from settings.ts on purpose. That file is imported by pages that
 * render in the browser, and a private reader living in it would be one
 * careless import away from shipping.
 */

const privateSettings = z.object({
  bankily_number: z.string(),
  payment_max_age_days: z.number().int().positive(),
  device_releases_per_year: z.number().int().nonnegative(),
  clock_grace_days: z.number().int().nonnegative(),
  /* When the app shows the owner what his trial did. See 0010. */
  trial_summary_days: z.number().int().nonnegative(),

  /* Who gets a free trial, and how sure we have to be. See 0012. */
  trial_one_per_fingerprint: z.boolean(),
  trial_one_per_phone: z.boolean(),
  trial_require_fingerprint: z.boolean(),
  trial_fingerprint_parts_to_match: z.number().int().positive(),
  trial_similarity_percent: z.number().int().min(0).max(100),

  /* How long the one-click activation link lives. See 0013. */
  activation_token_hours: z.number().int().positive(),

  /* Trades open only in test mode, from the admin area. See 0015. */
  test_packs: z.array(z.string()),
});

export type PrivateSettings = z.infer<typeof privateSettings>;

const keys = Object.keys(privateSettings.shape);

export async function getPrivateSettings(): Promise<PrivateSettings | null> {
  const supabase = adminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", keys);

  if (error || !data) return null;

  const parsed = privateSettings.safeParse(
    Object.fromEntries(data.map((row) => [row.key, row.value]))
  );
  return parsed.success ? parsed.data : null;
}
