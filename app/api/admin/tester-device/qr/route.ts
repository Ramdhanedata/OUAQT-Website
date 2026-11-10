import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";
import { newEnrolment } from "@/builder/licence/tester-pass";

/*
 * A QR code that makes the iPhone scanning it one of OUAQT's test devices
 * (0040). It holds a one-time code valid for a few minutes, on this very
 * address: the iPhone's shops open on the same one, so the pass Safari is
 * given there is the one they inherit.
 */

const body = z.object({ label: z.string().trim().min(1).max(60) }).strict();

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const made = await newEnrolment(supabase, input.data.label, gate.staff.id);
  if (!made) return NextResponse.json({ error: "not_saved" }, { status: 502 });

  const link = `${new URL(request.url).origin}/api/tester-device/enrol?code=${made.code}`;
  const svg = await QRCode.toString(link, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } });

  await audit({
    actorId: gate.staff.id,
    subject: "settings",
    subjectId: "tester_devices",
    action: "tester_qr_made",
    detail: { label: input.data.label },
  });

  return NextResponse.json({ link, until: made.until.toISOString(), qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` });
}
