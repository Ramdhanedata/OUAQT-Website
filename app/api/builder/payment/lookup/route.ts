import { NextResponse } from "next/server";
import { z } from "zod";
import { mayReadImages } from "@/builder/ai";
import { attemptKeys, clearFailures, describe, openByNumber, recordFailure, waitingFor } from "@/builder/config-code/server";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { adminClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";
import { daysLeft, graceDaysLeft, statusOf, type LicencePlan } from "@/builder/licence/status";
import { priceFor } from "@/builder/payment/pricing";

/*
 * Before paying with a numéro de série: which shop it is, where its licence
 * stands, and what there is to pay, worked out the same way as the account
 * page. Only what the payment screen shows goes back.
 */

const body = z.object({ number: z.string().max(400) }).strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const keys = await attemptKeys(request, null, "pay");
  const wait = await waitingFor(admin, keys);
  if (wait > 0) return NextResponse.json({ error: "slow_down", wait }, { status: 429 });

  const found = await openByNumber(admin, input.data.number);
  if (found.kind === "unknown") {
    const next = await recordFailure(admin, keys);
    return NextResponse.json({ error: "unknown", wait: next }, { status: 404 });
  }
  await clearFailures(admin, keys);
  if (found.kind === "expired") return NextResponse.json({ error: "expired" }, { status: 410 });

  const [settings, secrets] = await Promise.all([getPublicSettings(), getPrivateSettings()]);
  const shown = describe(found);

  let licence = null;
  let pending = false;
  let launchClient = false;
  if (found.kind === "shop") {
    const [{ data: row }, { data: lastPayment }, { data: business }] = await Promise.all([
      admin.from("licences").select("plan, status, starts_at, ends_at").eq("business_id", found.businessId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("payments").select("status").eq("business_id", found.businessId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("businesses").select("launch_client").eq("id", found.businessId).single(),
    ]);
    launchClient = Boolean(business?.launch_client);
    pending = lastPayment?.status === "pending_confirmation";
    if (row) {
      const shape = {
        plan: row.plan as LicencePlan,
        startsAt: row.starts_at ? new Date(row.starts_at) : null,
        endsAt: row.ends_at ? new Date(row.ends_at) : null,
        suspended: row.status === "suspended",
      };
      const now = new Date();
      const rules = { renewalGraceDays: settings?.renewal_grace_days ?? 0 };
      licence = {
        status: statusOf(shape, now, rules),
        endsAt: shape.endsAt ? shape.endsAt.toISOString() : null,
        daysLeft: daysLeft(shape, now),
        graceDaysLeft: graceDaysLeft(shape, now, rules),
      };
    }
  }

  return NextResponse.json(
    {
      serial: shown.serial,
      pack: shown.pack,
      nameLatin: shown.nameLatin,
      nameArabic: shown.nameArabic,
      licence,
      pending,
      price: settings ? priceFor("annual", settings, launchClient) : null,
      bankilyNumber: secrets?.bankily_number.trim() || null,
      aiReadsImages: mayReadImages(),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
