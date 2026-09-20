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
