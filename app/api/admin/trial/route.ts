import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";

/*
 * A trial given by hand to someone the rules turned away.
 *
 * The rules refuse a machine that has already had a trial. A shop that bought
 * a second-hand PC from another shop looks exactly like that, and so does a
 * man using his brother's computer for an afternoon. Both of them are honest,
 * both of them are refused, and both of them end up on WhatsApp.
 *
 * This is how that call ends. A reason is required, because a grant with no
 * reason beside it is no use to whoever reads this list in a year.
 */

const body = z
  .object({
    businessId: z.string().uuid(),
    reason: z.string().trim().min(4).max(400),
  })
  .strict();

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { error } = await supabase.from("trial_overrides").insert({
    business_id: input.data.businessId,
    reason: input.data.reason,
    created_by: gate.staff.id,
  });

  if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });

  await audit({
    actorId: gate.staff.id,
    subject: "licence",
    subjectId: input.data.businessId,
    action: "trial_granted_by_hand",
    detail: { reason: input.data.reason },
  });

  return NextResponse.json({ ok: true });
}
