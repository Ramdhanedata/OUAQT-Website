import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { normaliseConfigurationCode } from "@/builder/config-code/code";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";

/*
 * Staff closing the loop on a code de configuration, from Demandes.
 *
 *   sent     a code asked for again was sent by hand on WhatsApp, until the
 *            send is connected (builder/notify/whatsapp.ts).
 *   revive   an expired code works again, for thirty more days, for an owner
 *            who wrote in. Expired codes are never deleted, so this is always
 *            possible.
 */

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("sent"), requestId: z.string().uuid() }).strict(),
  z.object({ action: z.literal("revive"), code: z.string().trim().min(1).max(200) }).strict(),
]);

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "no_database" }, { status: 503 });

  if (input.data.action === "sent") {
    const { data, error } = await admin
      .from("configuration_code_requests")
      .update({ handled_at: new Date().toISOString(), handled_by: gate.staff.id })
      .eq("id", input.data.requestId)
      .select("draft_id");
    if (error || !data?.length) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await audit({
      actorId: gate.staff.id,
      subject: "configuration_code",
      subjectId: data[0].draft_id,
      action: "configuration_code_sent_by_hand",
      detail: {},
    });
    return NextResponse.json({ ok: true });
  }

  const code = normaliseConfigurationCode(input.data.code);
  const { data, error } = await admin
    .from("builder_drafts")
    .update({ status: "active", last_accessed_at: new Date().toISOString() })
    .eq("code", code)
    .select("id");
  if (error || !data?.length) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await audit({
    actorId: gate.staff.id,
    subject: "configuration_code",
    subjectId: data[0].id,
    action: "configuration_code_revived",
    detail: {},
  });
  return NextResponse.json({ ok: true });
}
