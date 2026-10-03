import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";
import { grantLicence, restoreLicence, type LicenceBefore } from "@/builder/payment/grant";
import { priceFor } from "@/builder/payment/pricing";
import { toMinor } from "@/app-ui/money";
import type { Extracted } from "@/builder/payment/checks";

/*
 * A person deciding about a payment.
 *
 * Confirm or reject one that waits; and, for one confirmed automatically
 * because its screenshot matched (see 0022), keep it or undo it. Nothing
 * automatic reaches this route. A person looked at the screenshot and
 * decided, and both the decision and the person are written down before the
 * licence moves.
 *
 * And one thing after: an owner who sent more than the price of what he
 * bought is owed the rest (2026-10-03). Staff send it back themselves, by
 * the app it came from, and say so here, so the payment stops showing as
 * owed and the trail says who sent it and when.
 */

const body = z.object({
  paymentId: z.string().uuid(),
  action: z.enum(["confirm", "reject", "keep", "undo", "refunded"]),
  reason: z.string().trim().max(300).optional(),
  /*
   * Confirming, the length the person grants: what the amount on the image
   * paid for. A payment filed without a plan chosen is filed as what its
   * amount said, or as a year when nothing could be read.
   */
  plan: z.enum(["annual", "semiannual"]).optional(),
});

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
    .select("id, business_id, plan, expected_amount, status, auto_confirmed, licence_before, reviewed_at, extracted")
    .eq("id", input.data.paymentId)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: "not_found" }, { status: 404 });

  /* The rest of an overpayment, sent back by a person: written down once, at what was owed. */
  if (input.data.action === "refunded") {
    const read = (payment.extracted as Extracted)?.amountMru;
    const owed = payment.status === "confirmed" && read != null ? toMinor(read) - Number(payment.expected_amount) : 0;
    if (owed <= 0) return NextResponse.json({ error: "nothing_owed" }, { status: 409 });
    const { data: already } = await supabase
      .from("audit_events")
      .select("id")
      .eq("subject", "payment")
      .eq("subject_id", payment.id)
      .eq("action", "refunded")
      .limit(1)
      .maybeSingle();
    if (already) return NextResponse.json({ error: "already_refunded" }, { status: 409 });
    await audit({
      actorId: gate.staff.id,
      subject: "payment",
      subjectId: payment.id,
      action: "refunded",
      detail: { amount: owed, business: payment.business_id },
    });
    return NextResponse.json({ status: "refunded", amount: owed });
  }

  /* An automatic confirmation, looked at by a person: kept, or undone. */
  if (input.data.action === "keep" || input.data.action === "undo") {
    if (!payment.auto_confirmed || payment.reviewed_at || payment.status !== "confirmed") {
      return NextResponse.json({ error: "already_decided", status: payment.status }, { status: 409 });
    }
    if (input.data.action === "undo" && !input.data.reason) {
      return NextResponse.json({ error: "reason_needed" }, { status: 400 });
    }
    if (input.data.action === "undo") {
      const restored = payment.licence_before
        ? await restoreLicence(supabase, payment.licence_before as LicenceBefore)
        : false;
      if (!restored) return NextResponse.json({ error: "not_restored" }, { status: 502 });
    }

    const status = input.data.action === "undo" ? "rejected_manual" : "confirmed";
    await supabase
      .from("payments")
      .update({
        status,
        reviewer_id: gate.staff.id,
        reviewed_at: new Date().toISOString(),
        reason: input.data.reason ?? null,
      })
      .eq("id", payment.id);

    await audit({
      actorId: gate.staff.id,
      subject: "payment",
      subjectId: payment.id,
      action: input.data.action === "undo" ? "auto_confirmation_undone" : "auto_confirmation_kept",
      detail: { reason: input.data.reason ?? null },
    });

    return NextResponse.json({ status });
  }

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

  /* Another length than it was filed as: the payment says so before the licence moves. */
  if (input.data.plan && input.data.plan !== payment.plan) {
    if (payment.plan !== "annual" && payment.plan !== "semiannual") {
      return NextResponse.json({ error: "plan_fixed" }, { status: 400 });
    }
    const [settings, { data: business }] = await Promise.all([
      getPublicSettings(),
      supabase.from("businesses").select("launch_client").eq("id", payment.business_id).maybeSingle(),
    ]);
    const price = settings ? priceFor(input.data.plan, settings, Boolean(business?.launch_client)) : null;
    if (!price || price.amount == null) return NextResponse.json({ error: "no_price" }, { status: 503 });
    const { error } = await supabase
      .from("payments")
      .update({ plan: input.data.plan, expected_amount: price.amount })
      .eq("id", payment.id);
    if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    payment.plan = input.data.plan;
    payment.expected_amount = price.amount;
  }

  const granted = await grantLicence(supabase, payment);
  if (!granted.ok) return NextResponse.json({ error: "not_saved" }, { status: 502 });
  const { endsAt } = granted;

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
    subjectId: granted.licenceId,
    action: "activated",
    detail: { until: endsAt, from: payment.id },
  });

  return NextResponse.json({ status: "confirmed", endsAt });
}
