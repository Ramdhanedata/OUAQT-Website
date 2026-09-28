import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";
import { grantLicence, restoreLicence, type LicenceBefore } from "@/builder/payment/grant";

/*
 * A person deciding about a payment.
 *
 * Confirm or reject one that waits; and, for one confirmed automatically
 * because its screenshot matched (see 0022), keep it or undo it. Nothing
 * automatic reaches this route. A person looked at the screenshot and
 * decided, and both the decision and the person are written down before the
 * licence moves.
 */

const body = z.object({
  paymentId: z.string().uuid(),
  action: z.enum(["confirm", "reject", "keep", "undo"]),
  reason: z.string().trim().max(300).optional(),
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
    .select("id, business_id, plan, expected_amount, status, auto_confirmed, licence_before, reviewed_at")
    .eq("id", input.data.paymentId)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: "not_found" }, { status: 404 });

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
