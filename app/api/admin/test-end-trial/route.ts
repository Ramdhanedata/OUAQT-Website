import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate, adminOpenForTesting } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";

/*
 * Ending a shop's free trial now, to test what its owner sees then.
 *
 * Thirty days is too long to wait to see the end-of-trial window, the QR
 * code and the payment that opens the software again. On a test deployment
 * against the test database, and nowhere else, this puts the trial's end a
 * minute in the past. The software shows its end window the next time it
 * opens with internet. A paid licence is never touched.
 */

const body = z.object({ businessId: z.string().uuid() }).strict();

const ONE_MINUTE_MS = 60_000; // not-a-rule: just in the past

export async function POST(request: Request) {
  if (!adminOpenForTesting()) return NextResponse.json({ error: "test_only" }, { status: 403 });
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { data: licence } = await supabase
    .from("licences")
    .select("id, plan")
    .eq("business_id", input.data.businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!licence) return NextResponse.json({ error: "no_licence" }, { status: 404 });
  if (licence.plan !== "trial") return NextResponse.json({ error: "not_trial" }, { status: 409 });

  const endsAt = new Date(Date.now() - ONE_MINUTE_MS).toISOString();
  const { error } = await supabase.from("licences").update({ ends_at: endsAt }).eq("id", licence.id);
  if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });

  await audit({
    actorId: gate.staff.id,
    subject: "licence",
    subjectId: licence.id,
    action: "trial_ended_for_test",
    detail: { endsAt },
  });

  return NextResponse.json({ endsAt });
}
