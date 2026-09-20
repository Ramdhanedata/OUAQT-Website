import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";

/*
 * The only step that turns money into a working licence.
 *
 * Nothing automatic reaches this route. A person looked at the screenshot and
 * decided, and both the decision and the person are written down before the
 * licence moves.
 */

const body = z.object({
  paymentId: z.string().uuid(),
  action: z.enum(["confirm", "reject"]),
  reason: z.string().trim().max(300).optional(),
});

/*
 * How long each plan buys. These are what the words mean rather than prices
 * anybody administers: an annual licence is a year.
 */
const MONTHS: Record<string, number | null> = {
  annual: 12, // not-a-rule: a year
  quarterly: 3, // not-a-rule: a quarter
  extra_device: 12, // not-a-rule: runs with the annual licence
  perpetual: null,
  setup_visit: null,
};

function addMonths(from: Date, months: number): Date {
  const out = new Date(from);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
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

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 501 });

  const { data: payment } = await supabase
    .from("payments")
    .select("id, business_id, plan, expected_amount, status")
    .eq("id", input.data.paymentId)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: "not_found" }, { status: 404 });

  /* Confirming twice must not buy two years. */
  if (payment.status === "confirmed" || payment.status === "rejected_manual") {
    return NextResponse.json({ error: "already_decided", status: payment.status }, { status: 409 });
  }

  if (input.data.action === "reject") {
    await supabase
      .from("payments")
      .update({
        status: "rejected_manual",
        reviewer_id: gate.staff.id,
        reason: input.data.reason ?? null,
      })
      .eq("id", payment.id);

    await audit({
      actorId: gate.staff.id,
      subject: "payment",
      subjectId: payment.id,
      action: "rejected_manual",
      detail: { reason: input.data.reason ?? null },
    });

    return NextResponse.json({ status: "rejected_manual" });
  }

  const { data: licence } = await supabase
    .from("licences")
    .select("id, plan, status, starts_at, ends_at")
    .eq("business_id", payment.business_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date();
  const months = MONTHS[payment.plan] ?? null;

  /*
   * Time is added to whichever is later: today, or the end he already has.
   * Paying early should not cost an owner the days he has left.
   */
  const from =
    licence?.ends_at && new Date(licence.ends_at) > now
      ? new Date(licence.ends_at)
      : now;
  const endsAt = months ? addMonths(from, months).toISOString() : null;

  const shape = {
    plan: payment.plan === "quarterly" ? "annual" : payment.plan,
    status: "active",
    starts_at: licence?.starts_at ?? now.toISOString(),
    ends_at: endsAt,
  };

  if (licence) {
    await supabase.from("licences").update(shape).eq("id", licence.id);
  } else {
    await supabase.from("licences").insert({
      business_id: payment.business_id,
      renewal_secret: crypto.randomUUID(),
      ...shape,
    });
  }

  await supabase
    .from("payments")
    .update({ status: "confirmed", reviewer_id: gate.staff.id })
    .eq("id", payment.id);

  await audit({
    actorId: gate.staff.id,
    subject: "payment",
    subjectId: payment.id,
    action: "confirmed",
    detail: { amount: payment.expected_amount, plan: payment.plan },
  });

  await audit({
    actorId: gate.staff.id,
    subject: "licence",
    subjectId: licence?.id ?? payment.business_id,
    action: "activated",
    detail: { until: endsAt, from: payment.id },
  });

  return NextResponse.json({ status: "confirmed", endsAt });
}
