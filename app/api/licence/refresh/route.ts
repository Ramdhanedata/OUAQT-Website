import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { adminClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";
import { hashToken } from "@/builder/licence/devices";
import { issueLicence } from "@/builder/licence/issue";
import { setupFor } from "@/builder/licence/setup";
import { signingKeyIsSet } from "@/builder/licence/sign";

/*
 * A shop asking whether anything has changed.
 *
 * The app calls this when it can, and carries on perfectly well when it
 * cannot: its licence file already says what the rules are and how long they
 * hold. This exists to deliver a renewal the owner has paid for, and to let
 * us stop a licence we have had to suspend.
 *
 * The schema is strict and it matters here more than anywhere. This endpoint
 * must never become a place where a shop's sales or stock could arrive, by
 * accident or by a later change of mind, so a body carrying anything beyond
 * these three fields is refused before it is read. There is no branch in this
 * file that could store trade data, because there is no field to store.
 */

const body = z
  .object({
    businessId: z.string().uuid(),
    deviceId: z.string().min(8).max(200),
    deviceToken: z.string().min(20).max(200),
    /*
     * Which configuration the app already holds. A number, so there is still
     * no field here that could carry a sale, a stock movement or a debt.
     */
    configurationVersion: z.number().int().nonnegative().optional(),
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

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { data: device } = await supabase
    .from("devices")
    .select("id, business_id, status, token_hash")
    .eq("business_id", input.data.businessId)
    .eq("device_id", input.data.deviceId)
    .maybeSingle();

  if (!device || device.status !== "active") {
    /*
     * A device that was released says the same thing as one that never
     * existed. The app treats both as "activate again", which is what the
     * owner will be told to do.
     */
    return NextResponse.json({ error: "unknown_device" }, { status: 404 });
  }

  if (!device.token_hash || device.token_hash !== (await hashToken(input.data.deviceToken))) {
    return NextResponse.json({ error: "wrong_token" }, { status: 403 });
  }

  const [{ data: business }, { data: licence }, settings, secrets] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name_latin")
      .eq("id", input.data.businessId)
      .maybeSingle(),
    supabase
      .from("licences")
      .select("plan, status, starts_at, ends_at, updates_until, renewal_secret")
      .eq("business_id", input.data.businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getPublicSettings(),
    getPrivateSettings(),
  ]);

  if (!business || !settings || !secrets) {
    return NextResponse.json({ error: "not_available" }, { status: 503 });
  }

  await supabase
    .from("devices")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", device.id);

  const { data: devices } = await supabase
    .from("devices")
    .select("device_id, role")
    .eq("business_id", business.id)
    .eq("status", "active");

  const signed = await issueLicence({
    businessId: business.id,
    businessName: business.name_latin,
    licence: {
      plan: (licence?.plan ?? "trial") as "trial" | "annual" | "perpetual" | "extra_device",
      status: licence?.status ?? "trial",
      startsAt: licence?.starts_at ?? null,
      endsAt: licence?.ends_at ?? null,
      updatesUntil: licence?.updates_until ?? null,
      renewalSecret: licence?.renewal_secret ?? "",
    },
    devices: devices ?? [],
    rules: {
      maxDevices: settings.max_devices,
      renewalGraceDays: settings.renewal_grace_days,
      clockGraceDays: secrets.clock_grace_days,
      deviceReleasesPerYear: secrets.device_releases_per_year,
      trialSummaryDays: secrets.trial_summary_days,
    },
  });

  /*
   * The owner's own lists, but only when they are not the ones the app
   * already has. They travel together, keyed to the configuration version:
   * anything that changes a product, a member of staff or a setting writes a
   * new configuration, so one number answers for all three.
   */
  const setup = await setupFor(supabase, business.id);
  const unchanged =
    input.data.configurationVersion !== undefined &&
    setup.configurationVersion === input.data.configurationVersion;

  return NextResponse.json({
    licence: signed,
    configurationVersion: setup.configurationVersion,
    configuration: unchanged ? null : setup.configuration,
    products: unchanged ? null : setup.products,
    staff: unchanged ? null : setup.staff,
    logo: unchanged ? null : setup.logo,
  });
}
