import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";

/*
 * Freeing a computer for an owner who has run out of his own releases.
 *
 * The yearly limit exists so one licence cannot be walked around a town. It
 * is not meant to strand a shop whose second machine died in March, which is
 * why staff can go past it, and why doing so is written down with a name
 * against it.
 */

const body = z
  .object({
    businessId: z.string().uuid(),
    deviceId: z.string().min(1).max(200),
    reason: z.string().trim().max(300).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { data: device } = await supabase
    .from("devices")
    .select("id, device_id, status")
    .eq("business_id", input.data.businessId)
    .eq("device_id", input.data.deviceId)
    .maybeSingle();

  if (!device) return NextResponse.json({ error: "unknown_device" }, { status: 404 });

  await supabase
    .from("devices")
    .update({ status: "released", token_hash: null })
    .eq("id", device.id);

  await supabase.from("device_releases").insert({
    business_id: input.data.businessId,
    device_id: device.device_id,
    released_by: gate.staff.id,
  });

  await audit({
    actorId: gate.staff.id,
    subject: "device",
    subjectId: device.device_id,
    action: "released_by_staff",
    detail: { businessId: input.data.businessId, reason: input.data.reason ?? null },
  });

  return NextResponse.json({ released: true });
}
