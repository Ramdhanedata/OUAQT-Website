import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";

/*
 * Changing a setting, which is how a price moves without a deploy.
 *
 * The new value has to be the same kind of thing as the old one. A trial
 * length typed as "quatorze" would pass straight through the database and
 * fail later, in a page, in front of an owner. The shape is checked here
 * instead, where there is somebody to tell.
 *
 * A price may become null: that is how "under review" is expressed, and the
 * pages that show prices already know to say so.
 */

const body = z.object({
  key: z.string().min(1).max(60),
  /* JSON as text, exactly as it is stored. */
  value: z.string().max(2000),
});

function sameKind(before: unknown, after: unknown): boolean {
  if (before === null || after === null) return true;
  if (Array.isArray(before)) return Array.isArray(after);
  return typeof before === typeof after;
}

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 403 });
  }

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.data.value);
  } catch {
    return NextResponse.json({ error: "not_json" }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 501 });

  const { data: existing } = await supabase
    .from("settings")
    .select("key, value")
    .eq("key", input.data.key)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "unknown_setting" }, { status: 404 });
  }

  if (!sameKind(existing.value, parsed)) {
    return NextResponse.json(
      { error: "wrong_kind", was: typeof existing.value },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("settings")
    .update({ value: parsed, updated_at: new Date().toISOString(), updated_by: gate.staff.id })
    .eq("key", input.data.key);

  if (error) {
    return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }

  await audit({
    actorId: gate.staff.id,
    subject: "settings",
    subjectId: input.data.key,
    action: "changed",
    detail: { from: existing.value, to: parsed },
  });

  /*
   * The site reads settings through a cached fetch, so without this a price
   * changed here would keep showing the old figure for five minutes. The
   * whole point of holding prices in this table is that a change is a change,
   * not a deploy and not a wait.
   */
  revalidateTag("settings");

  return NextResponse.json({ ok: true });
}
