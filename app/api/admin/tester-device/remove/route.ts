import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";

/*
 * A test device (0040) that is one no longer: a Mac sold, an iPhone lost, a
 * QR code shown to the wrong screen. Its row stays, dated; an iPhone's
 * installs go with it, and its pass stops working at the next activation.
 */

const body = z.object({ id: z.string().uuid() }).strict();

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const at = new Date().toISOString();
  const [{ error: own }, { error: installs }] = await Promise.all([
    supabase.from("tester_devices").update({ removed_at: at, enrol_hash: null }).eq("id", input.data.id).is("removed_at", null),
    supabase.from("tester_devices").update({ removed_at: at }).eq("via", input.data.id).is("removed_at", null),
  ]);
  if (own || installs) return NextResponse.json({ error: "not_saved" }, { status: 502 });

  await audit({
    actorId: gate.staff.id,
    subject: "settings",
    subjectId: "tester_devices",
    action: "tester_device_removed",
    detail: { id: input.data.id },
  });

  return NextResponse.json({ removed: true });
}
