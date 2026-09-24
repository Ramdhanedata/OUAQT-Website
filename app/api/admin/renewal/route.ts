import { NextResponse } from "next/server";
import { z } from "zod";
import { makeRenewalCode, normaliseCode } from "@/app-ui/codes";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";

/*
 * A code to read down the phone to a shop with no internet.
 *
 * It is tied to one computer's code and to that licence's own secret, so it
 * is no use anywhere else, and it carries the new end date inside it. Ten
 * characters, from an alphabet with no 0, O, 1, I or L, because somebody is
 * reading it out loud.
 *
 * Every one generated is written down with who generated it. A code is money.
 */

const body = z
  .object({
    businessId: z.string().uuid(),
    deviceCode: z.string().min(8).max(20),
    endsAt: z.string().min(10).max(30),
  })
  .strict();

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const endsAt = new Date(input.data.endsAt);
  if (Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "bad_date" }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { data: licence } = await supabase
    .from("licences")
    .select("id, renewal_secret")
    .eq("business_id", input.data.businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!licence) return NextResponse.json({ error: "no_licence" }, { status: 404 });

  const code = await makeRenewalCode({
    deviceCode: normaliseCode(input.data.deviceCode),
    endsAt,
    secret: licence.renewal_secret,
  });

  await supabase.from("renewal_codes").insert({
    licence_id: licence.id,
    device_code: normaliseCode(input.data.deviceCode),
    new_ends_at: endsAt.toISOString(),
    generated_by: gate.staff.id,
  });

  await audit({
    actorId: gate.staff.id,
    subject: "licence",
    subjectId: licence.id,
    action: "renewal_code_generated",
    detail: { deviceCode: normaliseCode(input.data.deviceCode), until: endsAt.toISOString() },
  });

  return NextResponse.json({ code, endsAt: endsAt.toISOString() });
}
