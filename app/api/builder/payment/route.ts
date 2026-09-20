import { NextResponse } from "next/server";
import { z } from "zod";
import { mayReadImages } from "@/builder/ai";
import { audit } from "@/builder/db/audit";
import { adminClient, sessionClient } from "@/builder/db/server";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { getPublicSettings } from "@/builder/db/settings";
import { checkPayment } from "@/builder/payment/checks";
import { priceFor, type Plan } from "@/builder/payment/pricing";

/*
 * An owner says he has paid.
 *
 * What happens here decides nothing about whether he has. The screenshot is
 * already in his own folder in a private bucket; this reads it, hashes it,
 * runs the checks, and files the result for a person to confirm. The only
 * status this route can write that means anything good is
 * `pending_confirmation`.
 *
 * On the free AI tier the screenshot is never read by a model, so the typed
 * reference is required and is the only thing there is to check against.
 */

const body = z.object({
  /* Where he put it: <his user id>/<something>. Checked, not trusted. */
  path: z.string().min(3).max(300),
  reference: z.string().trim().max(60).optional(),
  plan: z.enum(["annual", "quarterly", "perpetual", "extra_device", "setup_visit"]),
});

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = sessionClient();
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

  const [settings, secrets] = await Promise.all([
    getPublicSettings(),
    getPrivateSettings(),
  ]);
  if (!settings || !secrets) {
    return NextResponse.json({ error: "no_settings" }, { status: 503 });
  }

  if (secrets.bankily_number.trim() === "") {
    // No number to pay to means no payment page, which is what the brief
    // asks for: the whole thing stays hidden until it is set.
    return NextResponse.json({ error: "no_bankily_number" }, { status: 503 });
  }

  const price = priceFor(input.data.plan as Plan, settings, business.launch_client);
  if (price.amount == null) {
    // The price has not been set. Taking money against a number nobody has
    // decided is how a refund conversation starts.
    return NextResponse.json({ error: "no_price" }, { status: 503 });
  }

  const file = await admin.storage.from("payments").download(input.data.path);
  if (file.error || !file.data) {
    return NextResponse.json({ error: "no_screenshot" }, { status: 404 });
  }

  /*
   * Hashed here rather than in the browser. A hash sent up with the request
   * is only as honest as the page that sent it, and this one decides whether
   * the same receipt has been used twice.
   */
  const imageHash = await sha256(await file.data.arrayBuffer());
  const reference = input.data.reference?.trim() || null;

  const [{ data: sameImage }, { data: sameReference }] = await Promise.all([
    admin.from("payments").select("id").eq("image_hash", imageHash).maybeSingle(),
    reference
      ? admin.from("payments").select("id").eq("reference", reference).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const outcome = checkPayment({
    expectedAmount: price.amount,
    bankilyNumber: secrets.bankily_number,
    paymentMaxAgeDays: secrets.payment_max_age_days,
    now: new Date(),
    typedReference: reference,
    extracted: null,
    referenceAlreadyUsed: Boolean(sameReference),
    imageAlreadyUsed: Boolean(sameImage),
    aiReadsImages: mayReadImages(),
  });

  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      business_id: business.id,
      plan: input.data.plan,
      expected_amount: price.amount,
      screenshot_path: input.data.path,
      image_hash: imageHash,
      reference: outcome.reference,
      status: outcome.decision,
    })
    .select("id")
    .single();

  if (error || !payment) {
    console.error("payment: not saved", error);
    return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }

  await audit({
    actorId: owner.id,
    subject: "payment",
    subjectId: payment.id,
    action: outcome.decision,
    detail: {
      plan: input.data.plan,
      expected: price.amount,
      failures: outcome.failures,
    },
  });

  return NextResponse.json({
    paymentId: payment.id,
    decision: outcome.decision,
    failures: outcome.failures,
    expected: price.amount,
  });
}
