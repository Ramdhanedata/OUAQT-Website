import "server-only";

import { adminClient } from "@/builder/db/server";
import { getPrivateSettings } from "@/builder/db/private-settings";

const DAY_MS = 86_400_000; // not-a-rule: a day

/*
 * Whether the AI may be asked again today.
 *
 * Every call is counted in ai_calls (the admin area's cost page reads it),
 * and the day's total is held to ai_calls_per_day. Past it, the builder
 * keeps the owner's sentence for a person to read and a payment screenshot
 * waits for a person, which is what both do without an AI at all: nobody is
 * blocked, and nobody can run up the bill by sending the same request in a
 * loop.
 */
export async function aiBudgetLeft(): Promise<boolean> {
  const admin = adminClient();
  const secrets = await getPrivateSettings();
  if (!admin || !secrets) return false;
  const { count, error } = await admin
    .from("ai_calls")
    .select("id", { count: "exact", head: true })
    .gt("created_at", new Date(Date.now() - DAY_MS).toISOString());
  if (error) return false;
  return (count ?? 0) < secrets.ai_calls_per_day;
}
