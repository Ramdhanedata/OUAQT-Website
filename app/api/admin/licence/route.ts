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
 * From the Contrôle page (0031), the decisions about a person rather than a
 * payment:
 *
 *   gift        lifetime use, free: a permanent licence marked as a gift,
 *               never counted as money received.
 *   cancel      any licence ends now, a lifetime one included, with no
 *               grace: the software goes read-only at its next check, and
 *               paying for a licence opens it again.
 *   extend      days added to the end (a trial's, usually): from today when
 *               it has already ended.
 *   ban         suspended, and no computer may activate the shop or start
 *               another one from its computers (activate/route.ts).
 *   unban       the ban lifted and the suspension with it.
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
  z.object({ action: z.literal("gift"), businessId: z.string().uuid(), reason: z.string().trim().min(4).max(400) }).strict(),
  z.object({ action: z.literal("cancel"), businessId: z.string().uuid(), reason: z.string().trim().min(4).max(400) }).strict(),
  z.object({
    action: z.literal("extend"),
    businessId: z.string().uuid(),
    days: z.number().int().min(1).max(3650), // not-a-rule: ten years, a ceiling on a typed number
    reason: z.string().trim().min(4).max(400),
  }).strict(),
  z.object({ action: z.literal("ban"), businessId: z.string().uuid(), reason: z.string().trim().min(4).max(400) }).strict(),
  z.object({ action: z.literal("unban"), businessId: z.string().uuid(), reason: z.string().trim().min(4).max(400) }).strict(),
]);

const DAY = 86_400_000;

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { businessId, reason } = input.data;
  const actorId = gate.staff.id;

  const { data: shop } = await supabase.from("businesses").select("id, banned_at").eq("id", businessId).maybeSingle();
  if (!shop) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const banned = Boolean(shop.banned_at);

  /* A banned shop is unbanned first: nothing else reopens it by the side door. */
  if (banned && ["gift", "reactivate", "extend"].includes(input.data.action)) {
    return NextResponse.json({ error: "banned" }, { status: 409 });
  }

  if (input.data.action === "ban" || input.data.action === "unban") {
    const banning = input.data.action === "ban";
    if (banning === banned) return NextResponse.json({ error: "already" }, { status: 409 });
    const { error } = await supabase
      .from("businesses")
      .update(banning ? { banned_at: new Date().toISOString(), ban_reason: reason } : { banned_at: null, ban_reason: null })
      .eq("id", businessId);
    if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    /* The licence follows: suspended with the ban, back to its own state without it. */
    const { data: current } = await supabase
      .from("licences")
      .select("id, plan, status")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (current) {
      const status = banning ? "suspended" : current.status === "suspended" ? (current.plan === "trial" ? "trial" : "active") : current.status;
      await supabase.from("licences").update({ status }).eq("id", current.id);
    }
    await audit({ actorId, subject: "business", subjectId: businessId, action: banning ? "banned" : "unbanned", detail: { reason } });
    return NextResponse.json({ ok: true });
  }

  if (input.data.action === "gift") {
    const { data: current } = await supabase
      .from("licences")
      .select("id, plan, status, starts_at, ends_at, gift")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const now = new Date().toISOString();
    /* A suspension stays a decision of its own, as with a payment: reactivate it separately. */
    const shape = {
      plan: "perpetual",
      status: current?.status === "suspended" ? "suspended" : "active",
      starts_at: current?.starts_at ?? now,
      ends_at: null,
      gift: true,
      grace_days: null,
    };
    const { data: saved, error } = current
      ? await supabase.from("licences").update(shape).eq("id", current.id).select("id").single()
      : await supabase.from("licences").insert({ business_id: businessId, renewal_secret: crypto.randomUUID(), ...shape }).select("id").single();
    if (error || !saved) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    await audit({
      actorId,
      subject: "licence",
      subjectId: saved.id as string,
      action: "gifted_for_life",
      detail: { reason, business: businessId, before: current ? { plan: current.plan, ends_at: current.ends_at } : null },
    });
    return NextResponse.json({ ok: true });
  }

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
   * Ends now, whatever it was, with no grace: a lifetime licence becomes one
   * that ended today, so paying for a licence later opens it as any other.
   */
  if (input.data.action === "cancel") {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("licences")
      .update({
        plan: licence.plan === "trial" ? "trial" : "annual",
        starts_at: licence.starts_at ?? now,
        ends_at: now,
        grace_days: 0,
        gift: false,
      })
      .eq("id", licence.id);
    if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    await audit({
      actorId,
      subject: "licence",
      subjectId: licence.id,
      action: "cancelled",
      detail: { reason, business: businessId, before: { plan: licence.plan, ends_at: licence.ends_at } },
    });
    return NextResponse.json({ ok: true });
  }

  /* Days added to the end, from today when it has already passed; a trial not started starts now. */
  if (input.data.action === "extend") {
    if (licence.plan === "perpetual") return NextResponse.json({ error: "perpetual" }, { status: 409 });
    const now = new Date();
    const from = licence.ends_at && new Date(licence.ends_at) > now ? new Date(licence.ends_at) : now;
    const endsAt = new Date(from.getTime() + input.data.days * DAY).toISOString();
    const { error } = await supabase
      .from("licences")
      .update({ ends_at: endsAt, starts_at: licence.starts_at ?? now.toISOString(), grace_days: null })
      .eq("id", licence.id);
    if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    await audit({
      actorId,
      subject: "licence",
      subjectId: licence.id,
      action: "extended",
      detail: { reason, business: businessId, days: input.data.days, from: licence.ends_at, to: endsAt },
    });
    return NextResponse.json({ ok: true, endsAt });
  }

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
      /* A date chosen by staff is an ordinary end again, with its grace (a cancellation had none). */
      .update({ ends_at: endsAt, starts_at: licence.starts_at ?? now.toISOString(), ...(input.data.action === "set_end" ? { grace_days: null } : {}) })
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
