import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/builder/db/audit";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { adminClient, requestClient } from "@/builder/db/server";

/*
 * "Cet ordinateur ne fonctionne plus."
 *
 * A shop computer dies, is stolen, or is replaced, and the licence still
 * thinks it is one of the two. The owner frees it himself, because waiting
 * for us on a Sunday is not a support policy.
 *
 * Limited, because the same button is also how somebody would run one licence
 * around a town. Past the limit he is told plainly and given the WhatsApp
 * number, and staff can free it for him.
 */

const body = z
  .object({
    deviceId: z.string().min(1).max(200),
  })
  .strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = requestClient(request);
  const admin = adminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "no_database" }, { status: 503 });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.is_anonymous) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  /* His own business, read as him, so the licence cannot be somebody else's. */
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "no_business" }, { status: 404 });

  const secrets = await getPrivateSettings();
  if (!secrets) return NextResponse.json({ error: "not_available" }, { status: 503 });

  const startOfYear = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)).toISOString();
  const { count } = await admin
    .from("device_releases")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("released_at", startOfYear);

  if ((count ?? 0) >= secrets.device_releases_per_year) {
    return NextResponse.json(
      { error: "too_many_releases", allowed: secrets.device_releases_per_year },
      { status: 409 }
    );
  }

  const { data: device } = await admin
    .from("devices")
    .select("id, device_id, status")
    .eq("business_id", business.id)
    .eq("device_id", input.data.deviceId)
    .maybeSingle();

  if (!device || device.status !== "active") {
    return NextResponse.json({ error: "unknown_device" }, { status: 404 });
  }

  /* The token goes with it: a freed computer cannot go on refreshing. */
  await admin
    .from("devices")
    .update({ status: "released", token_hash: null })
    .eq("id", device.id);

  await admin.from("device_releases").insert({
    business_id: business.id,
    device_id: device.device_id,
    released_by: auth.user.id,
  });

  await audit({
    actorId: auth.user.id,
    subject: "device",
    subjectId: device.device_id,
    action: "released_by_owner",
    detail: { businessId: business.id },
  });

  return NextResponse.json({ released: true, left: secrets.device_releases_per_year - (count ?? 0) - 1 });
}
