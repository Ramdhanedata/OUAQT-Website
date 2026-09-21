import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/builder/db/audit";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { adminClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";
import { hashToken, newDeviceToken } from "@/builder/licence/devices";
import { issueLicence } from "@/builder/licence/issue";
import { signingKeyIsSet } from "@/builder/licence/sign";
import { setupFor } from "@/builder/licence/setup";
import { claimTrial } from "@/builder/licence/trial-claim";
import { trialEnd } from "@/builder/licence/status";
import { hashSerial, normaliseSerial } from "@/builder/serial/serial";

/*
 * A shop computer coming to life for the first time.
 *
 * The owner types his serial, the app sends the number it uses to identify
 * itself, and it gets back a signed licence it can check on its own from then
 * on. Nothing else is accepted: the schema is strict, so a body carrying a
 * day's sales is refused before anything looks at it.
 *
 * The trial starts here and not at account creation, because an owner who
 * builds his software on Friday and installs it on Monday should not lose the
 * weekend.
 */

const body = z
  .object({
    serial: z.string().min(8).max(20),
    deviceId: z.string().min(8).max(200),
    deviceName: z.string().trim().max(60).optional(),
    platform: z.enum(["windows", "mac"]),
    /*
     * The machine, in three salted hashes the app computes from its
     * motherboard, its system disk and the operating system's machine id. We
     * never receive the values behind them, and there is no field here that
     * could carry one.
     */
    fingerprint: z
      .object({
        board: z.string().min(16).max(128).nullish(),
        disk: z.string().min(16).max(128).nullish(),
        machine: z.string().min(16).max(128).nullish(),
      })
      .strict()
      .optional(),
  })
  .strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!signingKeyIsSet()) {
    return NextResponse.json({ error: "no_signing_key" }, { status: 503 });
  }

  const serial = normaliseSerial(input.data.serial);
  if (!serial) return NextResponse.json({ error: "unknown_serial" }, { status: 404 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { data: found } = await supabase
    .from("serials")
    .select("business_id")
    .eq("serial_hash", await hashSerial(serial))
    .maybeSingle();

  if (!found) return NextResponse.json({ error: "unknown_serial" }, { status: 404 });

  const [{ data: business }, settings, secrets] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, owner_id, name_latin, receipt_address")
      .eq("id", found.business_id)
      .maybeSingle(),
    getPublicSettings(),
    getPrivateSettings(),
  ]);

  if (!business || !settings || !secrets) {
    return NextResponse.json({ error: "not_available" }, { status: 503 });
  }

  const { data: devices } = await supabase
    .from("devices")
    .select("id, device_id, role, status")
    .eq("business_id", business.id);

  const active = (devices ?? []).filter((device) => device.status === "active");
  const already = active.find((device) => device.device_id === input.data.deviceId);

  /*
   * The same computer activating again is not a second computer. A reinstall,
   * a crash, a licence file deleted by a cleanup tool: all of them look like
   * this, and none of them should cost an owner one of his two machines.
   */
  const token = newDeviceToken();
  const tokenHash = await hashToken(token);

  if (already) {
    await supabase
      .from("devices")
      .update({ last_seen: new Date().toISOString(), token_hash: tokenHash })
      .eq("id", already.id);
  } else {
    if (active.length >= settings.max_devices) {
      return NextResponse.json(
        { error: "device_limit", maxDevices: settings.max_devices },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("devices").insert({
      business_id: business.id,
      device_id: input.data.deviceId,
      name: input.data.deviceName ?? null,
      platform: input.data.platform,
      role: active.length === 0 ? "main" : "secondary",
      token_hash: tokenHash,
    });

    if (error) {
      return NextResponse.json({ error: "not_activated" }, { status: 502 });
    }
  }

  const { data: licence } = await supabase
    .from("licences")
    .select("id, plan, status, starts_at, ends_at, updates_until, renewal_secret")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let current = licence;

  /* The trial begins the first time a computer runs the software. */
  if (current && current.plan === "trial" && !current.starts_at) {
    const fingerprint = {
      board: input.data.fingerprint?.board ?? null,
      disk: input.data.fingerprint?.disk ?? null,
      machine: input.data.fingerprint?.machine ?? null,
    };

    /*
     * This exact computer under another shop is the plainest case of all, and
     * it does not need a fingerprint to see.
     */
    const { data: seenElsewhere } = await supabase
      .from("devices")
      .select("business_id")
      .eq("device_id", input.data.deviceId)
      .neq("business_id", business.id)
      .limit(1)
      .maybeSingle();

    const outcome = seenElsewhere
      ? ({ kind: "refused", decision: { allowed: false, because: "same_machine" } } as const)
      : await claimTrial(supabase, business, fingerprint, secrets, true);

    if (outcome.kind === "refused") {
      await audit({
        actorId: null,
        subject: "licence",
        subjectId: current.id,
        action: "trial_refused",
        detail: { deviceId: input.data.deviceId, because: outcome.decision.because },
      });

      /*
       * A refusal is a door, not a verdict. The app has no configuration yet,
       * so the number to call travels with the error: whoever this is, a
       * second-hand PC or a man on his brother's phone, there is a person at
       * the other end of it.
       */
      return NextResponse.json(
        {
          error: "trial_not_available",
          because: outcome.decision.because,
          supportWhatsapp: settings.support_whatsapp,
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const starts = now.toISOString();
    const ends = trialEnd(now, settings.trial_days).toISOString();

    await supabase
      .from("licences")
      .update({ starts_at: starts, ends_at: ends })
      .eq("id", current.id);

    current = { ...current, starts_at: starts, ends_at: ends };

    await audit({
      actorId: null,
      subject: "licence",
      subjectId: current.id,
      action: "trial_started",
      detail: { deviceId: input.data.deviceId },
    });
  }

  const { data: fresh } = await supabase
    .from("devices")
    .select("device_id, role")
    .eq("business_id", business.id)
    .eq("status", "active");

  const signed = await issueLicence({
    businessId: business.id,
    businessName: business.name_latin,
    licence: {
      plan: (current?.plan ?? "trial") as "trial" | "annual" | "perpetual" | "extra_device",
      status: current?.status ?? "trial",
      startsAt: current?.starts_at ?? null,
      endsAt: current?.ends_at ?? null,
      updatesUntil: current?.updates_until ?? null,
      renewalSecret: current?.renewal_secret ?? "",
    },
    devices: fresh ?? [],
    rules: {
      maxDevices: settings.max_devices,
      renewalGraceDays: settings.renewal_grace_days,
      clockGraceDays: secrets.clock_grace_days,
      deviceReleasesPerYear: secrets.device_releases_per_year,
      trialSummaryDays: secrets.trial_summary_days,
    },
  });

  await audit({
    actorId: null,
    subject: "device",
    subjectId: input.data.deviceId,
    action: already ? "reactivated" : "activated",
    detail: { businessId: business.id, platform: input.data.platform },
  });

  /*
   * The configuration and the shop's own lists travel with the licence, so a
   * computer that is online for one call has everything it needs afterwards.
   */
  const setup = await setupFor(supabase, business.id);

  return NextResponse.json({
    licence: signed,
    deviceToken: token,
    configuration: setup.configuration,
    configurationVersion: setup.configurationVersion,
    products: setup.products,
    staff: setup.staff,
    logo: setup.logo,
  });
}
