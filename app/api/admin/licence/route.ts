import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";
import { grantLicence } from "@/builder/payment/grant";

/*
 * Staff deciding about one shop's licence, from its page in the admin area.
 *
 *   suspend     for a breach of the terms. The software goes read only the
 *               next time it asks for its licence; the owner keeps reading
 *               and exporting everything, as the terms promise.
 *   reactivate  ends a suspension. The dates were never touched, so the
 *               licence is exactly what it was.
 *   grant       licence time paid for outside the site, in cash or by
 *               transfer, added the same way a confirmed payment adds it.
 *   set_end     a new end date chosen by staff: a trial lengthened, days
 *               given, a date corrected.
 *   end         the subscription ends today. A trial stops at once; a paid
 *               licence goes through the same grace as one left unpaid.
 *               A permanent licence has no end to move: it is suspended.
 *
 * Each one needs a reason and writes it to the trail before answering. The
 * status column only ever holds a decision: every other state is worked out
 * from the dates, which is why reactivating can simply say "trial" or
 * "active" and let the dates speak.
 */

const body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suspend"),
    businessId: z.string().uuid(),
    reason: z.string().trim().min(4).max(400),
  }).strict(),
  z.object({
    action: z.literal("reactivate"),
    businessId: z.string().uuid(),
    reason: z.string().trim().min(4).max(400),
  }).strict(),
  z.object({
    action: z.literal("set_end"),
    businessId: z.string().uuid(),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().trim().min(4).max(400),
  }).strict(),
  z.object({
    action: z.literal("end"),
    businessId: z.string().uuid(),
    reason: z.string().trim().min(4).max(400),
  }).strict(),
  z.object({
    action: z.literal("grant"),
    businessId: z.string().uuid(),
    plan: z.enum(["quarterly", "semiannual", "annual", "perpetual"]),
    reason: z.string().trim().min(4).max(400),
  }).strict(),
]);

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { businessId, reason } = input.data;

  if (input.data.action === "grant") {
    const granted = await grantLicence(supabase, { business_id: businessId, plan: input.data.plan });
    if (!granted.ok) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    await audit({
      actorId: gate.staff.id,
      subject: "licence",
      subjectId: granted.licenceId,
      action: "granted_by_hand",
      detail: { plan: input.data.plan, until: granted.endsAt, reason, before: granted.before },
    });
    return NextResponse.json({ ok: true, endsAt: granted.endsAt });
  }

  /* The one the software runs on: the refresh route reads the newest. */
  const { data: licence } = await supabase
    .from("licences")
    .select("id, plan, status, starts_at, ends_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!licence) return NextResponse.json({ error: "no_licence" }, { status: 404 });

  /*
   * Moving the end. The suspension, if there is one, is left as it is. A
   * trial that has not started yet starts now, or its first activation would
   * set its dates again and undo this.
   */
  if (input.data.action === "set_end" || input.data.action === "end") {
    if (licence.plan === "perpetual") return NextResponse.json({ error: "perpetual" }, { status: 409 });
    const now = new Date();
    const endsAt = input.data.action === "end" ? now.toISOString() : `${input.data.endsOn}T23:59:59.000Z`;
    if (Number.isNaN(new Date(endsAt).getTime())) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const { error } = await supabase
      .from("licences")
      .update({ ends_at: endsAt, starts_at: licence.starts_at ?? now.toISOString() })
      .eq("id", licence.id);
    if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    await audit({
      actorId: gate.staff.id,
      subject: "licence",
      subjectId: licence.id,
      action: input.data.action === "end" ? "subscription_ended" : "end_date_set",
      detail: { reason, business: businessId, from: licence.ends_at, to: endsAt },
    });
    return NextResponse.json({ ok: true, endsAt });
  }

  const suspending = input.data.action === "suspend";
  if (suspending === (licence.status === "suspended")) {
    return NextResponse.json({ error: "already", status: licence.status }, { status: 409 });
  }

  const status = suspending ? "suspended" : licence.plan === "trial" ? "trial" : "active";
  const { error } = await supabase.from("licences").update({ status }).eq("id", licence.id);
  if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });

  await audit({
    actorId: gate.staff.id,
    subject: "licence",
    subjectId: licence.id,
    action: suspending ? "suspended" : "suspension_lifted",
    detail: { reason, business: businessId },
  });

  return NextResponse.json({ ok: true, status });
}
