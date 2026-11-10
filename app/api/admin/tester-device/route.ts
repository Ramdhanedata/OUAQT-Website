import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { adminClient } from "@/builder/db/server";
import { isTesterDevice, type Fingerprint } from "@/builder/licence/trial";

/*
 * Marking one of OUAQT's own devices as a test device (0040), or taking the
 * mark off again.
 *
 * Staff pick it from the devices of a shop it activated, so the marks come
 * from what the device itself sent: its fingerprint and its device id. Its
 * trials are then never refused and it takes no place in any shop. That is a
 * rule let go, so each change is written down with a name against it.
 */

const body = z
  .object({
    businessId: z.string().uuid(),
    deviceId: z.string().min(1).max(200),
    tester: z.boolean(),
  })
  .strict();

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  const secrets = await getPrivateSettings();
  if (!supabase || !secrets) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { data: device } = await supabase
    .from("devices")
    .select("device_id, name, platform, fingerprint, businesses(name_latin)")
    .eq("business_id", input.data.businessId)
    .eq("device_id", input.data.deviceId)
    .maybeSingle();
  if (!device) return NextResponse.json({ error: "unknown_device" }, { status: 404 });

  const mark = (device.fingerprint as Fingerprint | null) ?? null;
  const fingerprint: Fingerprint = { board: mark?.board ?? null, disk: mark?.disk ?? null, machine: mark?.machine ?? null };
  const deviceId = device.device_id as string;

  const { data: rows, error: unread } = await supabase
    .from("tester_devices")
    .select("id, device_id, fingerprint_board, fingerprint_disk, fingerprint_machine")
    .is("removed_at", null);
  if (unread) return NextResponse.json({ error: "not_saved" }, { status: 502 });

  /* The rows that already name this device, by either of its marks. */
  const naming = (rows ?? []).filter((row) =>
    isTesterDevice(
      { deviceId, fingerprint },
      [
        {
          deviceId: (row.device_id as string | null) ?? null,
          fingerprint: {
            board: (row.fingerprint_board as string | null) ?? null,
            disk: (row.fingerprint_disk as string | null) ?? null,
            machine: (row.fingerprint_machine as string | null) ?? null,
          },
        },
      ],
      secrets.trial_fingerprint_parts_to_match
    )
  );

  if (input.data.tester && naming.length === 0) {
    const shop = Array.isArray(device.businesses) ? device.businesses[0] : device.businesses;
    const label = [device.name ?? device.platform ?? "", (shop as { name_latin?: string } | null)?.name_latin ?? ""]
      .filter(Boolean)
      .join(" · ");
    const { error } = await supabase.from("tester_devices").insert({
      label,
      device_id: deviceId,
      fingerprint_board: fingerprint.board,
      fingerprint_disk: fingerprint.disk,
      fingerprint_machine: fingerprint.machine,
      added_by: gate.staff.id,
    });
    if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }

  if (!input.data.tester && naming.length > 0) {
    const { error } = await supabase
      .from("tester_devices")
      .update({ removed_at: new Date().toISOString() })
      .in(
        "id",
        naming.map((row) => row.id as string)
      );
    if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }

  await audit({
    actorId: gate.staff.id,
    subject: "device",
    subjectId: deviceId,
    action: input.data.tester ? "tester_device_added" : "tester_device_removed",
    detail: { businessId: input.data.businessId },
  });

  return NextResponse.json({ tester: input.data.tester });
}
