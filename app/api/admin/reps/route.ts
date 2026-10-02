import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";
import { newRepCode } from "@/builder/referral";

/*
 * Staff managing representatives, from their pages.
 *
 *   create  a new representative, with a code of their own made here
 *   update  their name, phone, bonus and note
 *   active  deactivate or reactivate: never deleted, so what they earned stays
 *   payout  records money handed to them, so what is owed is earned minus paid
 *   assign  credits a shop to a representative by hand, or to nobody
 *
 * Amounts arrive in ouguiyas, as typed, and are kept in the smallest unit
 * like every other amount.
 */

const money = z.number().finite().min(0).max(100_000_000); // not-a-rule: a sanity ceiling on a typed amount
const details = {
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional(),
  percent: z.number().finite().min(0).max(100),
  perShop: money,
  note: z.string().trim().max(500).optional(),
};

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...details }).strict(),
  z.object({ action: z.literal("update"), id: z.string().uuid(), ...details }).strict(),
  z.object({ action: z.literal("active"), id: z.string().uuid(), active: z.boolean() }).strict(),
  z.object({ action: z.literal("payout"), id: z.string().uuid(), amount: money.positive(), note: z.string().trim().max(200).optional() }).strict(),
  z.object({ action: z.literal("assign"), businessId: z.string().uuid(), id: z.string().uuid().nullable() }).strict(),
]);

const minor = (ouguiyas: number) => Math.round(ouguiyas * 100);
const CODE_TRIES = 5; // not-a-rule: a fresh code is unique on the first try all but never

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });
  const actorId = gate.staff.id;
  const data = input.data;

  if (data.action === "create") {
    for (let attempt = 0; attempt < CODE_TRIES; attempt += 1) {
      const code = newRepCode();
      const { data: made, error } = await supabase
        .from("representatives")
        .insert({
          name: data.name,
          phone: data.phone || null,
          code,
          commission_percent: data.percent,
          bonus_per_client: minor(data.perShop),
          note: data.note || null,
          created_by: actorId,
        })
        .select("id, code")
        .single();
      if (made) {
        await audit({ actorId, subject: "representative", subjectId: made.id, action: "created", detail: { name: data.name, code } });
        return NextResponse.json({ id: made.id, code: made.code });
      }
      /* A code already taken: draw another. Anything else is a real failure. */
      if (error?.code !== "23505") break;
    }
    return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }

  if (data.action === "update") {
    const { data: saved } = await supabase
      .from("representatives")
      .update({ name: data.name, phone: data.phone || null, commission_percent: data.percent, bonus_per_client: minor(data.perShop), note: data.note || null })
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (!saved) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await audit({ actorId, subject: "representative", subjectId: data.id, action: "updated", detail: { percent: data.percent, perShop: minor(data.perShop) } });
    return NextResponse.json({ ok: true });
  }

  if (data.action === "active") {
    const { data: saved } = await supabase.from("representatives").update({ active: data.active }).eq("id", data.id).select("id").maybeSingle();
    if (!saved) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await audit({ actorId, subject: "representative", subjectId: data.id, action: data.active ? "reactivated" : "deactivated" });
    return NextResponse.json({ ok: true });
  }

  if (data.action === "payout") {
    const { data: rep } = await supabase.from("representatives").select("id").eq("id", data.id).maybeSingle();
    if (!rep) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const { error } = await supabase
      .from("representative_payouts")
      .insert({ representative_id: data.id, amount: minor(data.amount), note: data.note || null, created_by: actorId });
    if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    await audit({ actorId, subject: "representative", subjectId: data.id, action: "paid", detail: { amount: minor(data.amount) } });
    return NextResponse.json({ ok: true });
  }

  /* assign */
  if (data.id) {
    const { data: rep } = await supabase.from("representatives").select("id").eq("id", data.id).maybeSingle();
    if (!rep) return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { data: shop } = await supabase.from("businesses").update({ representative_id: data.id }).eq("id", data.businessId).select("id").maybeSingle();
  if (!shop) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await audit({ actorId, subject: "business", subjectId: data.businessId, action: "representative_set", detail: { representativeId: data.id } });
  return NextResponse.json({ ok: true });
}
