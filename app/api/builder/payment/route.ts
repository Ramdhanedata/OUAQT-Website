import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient, sessionClient } from "@/builder/db/server";
import { PAYMENT_APPS } from "@/builder/payment/apps";
import { filePayment } from "@/builder/payment/file";
import type { Plan } from "@/builder/payment/pricing";

/*
 * An owner says he has paid.
 *
 * What happens here decides nothing about whether he has. The screenshot is
 * already in his own folder in a private bucket; this reads it, hashes it,
 * runs the checks, and files the result for a person to confirm. The only
 * status this route can write that means anything good is
 * `pending_confirmation`.
 *
 * He types nothing: he says which app he paid from, and the amount, the date
 * and the transaction number are read off the screenshot, by the AI on the
 * paid tier and by a person otherwise.
 */

/* Reading the screenshot can take a while, and he is on the page waiting. */
export const maxDuration = 30; // not-a-rule: seconds a request may run

const body = z.object({
  /* Where he put it: <his user id>/<something>. Checked, not trusted. */
  path: z.string().min(3).max(300),
  app: z.enum(PAYMENT_APPS),
  plan: z.enum(["annual", "semiannual", "quarterly", "perpetual", "extra_device", "setup_visit"]),
});

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = await sessionClient();
  const admin = adminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "no_database" }, { status: 501 });
  }

  const { data: auth } = await supabase.auth.getUser();
  const owner = auth.user;
  if (!owner || owner.is_anonymous) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  /* His folder, or nobody's. A path is a claim until it is checked. */
  if (!input.data.path.startsWith(`${owner.id}/`)) {
    return NextResponse.json({ error: "not_yours" }, { status: 403 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, launch_client")
    .limit(1)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "no_business" }, { status: 404 });
  }

  const file = await admin.storage.from("payments").download(input.data.path);
  if (file.error || !file.data) {
    return NextResponse.json({ error: "no_screenshot" }, { status: 404 });
  }

  const filed = await filePayment(admin, {
    businessId: business.id,
    launchClient: business.launch_client,
    plan: input.data.plan as Plan,
    path: input.data.path,
    bytes: await file.data.arrayBuffer(),
    app: input.data.app,
    actorId: owner.id,
  });
  if (!filed.ok) return NextResponse.json({ error: filed.error }, { status: filed.status });

  return NextResponse.json({
    paymentId: filed.paymentId,
    decision: filed.decision,
    failures: filed.failures,
    expected: filed.expected,
    read: filed.read,
  });
}
