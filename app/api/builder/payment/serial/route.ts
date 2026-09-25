import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isTester, TESTER_COOKIE } from "@/builder/admin/tester";
import { attemptKeys, openByNumber, recordFailure, shopFor, waitingFor } from "@/builder/config-code/server";
import { adminClient } from "@/builder/db/server";
import { PAYMENT_APPS } from "@/builder/payment/apps";
import { filePayment } from "@/builder/payment/file";

/*
 * Paying with nothing but the numéro de série.
 *
 * An owner who built his software from the phone never made an account and
 * never will, so this asks for none: the number says which shop, the
 * screenshot of the transfer comes with it, from whichever app he paid
 * with, and a person confirms it
 * in the admin area, which turns the trial into a full licence. Nothing here
 * decides that he has paid.
 *
 * The screenshot is put in the payments bucket by the server, under the
 * shop's own folder, since there is no session for the browser to upload
 * with. A wrong number counts towards the same slow-down as the code box.
 */

const MAX_BYTES = 2_000_000; // not-a-rule: a prepared screenshot is well under this

/* Reading the screenshot can take a while, and he is on the page waiting. */
export const maxDuration = 30; // not-a-rule: seconds a request may run

const fields = z.object({
  number: z.string().max(400),
  plan: z.enum(["annual", "quarterly", "perpetual"]),
  app: z.enum(PAYMENT_APPS),
});

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const input = fields.safeParse({
    number: form.get("number"),
    plan: form.get("plan"),
    app: form.get("app"),
  });
  const image = form.get("image");
  if (!input.success || !(image instanceof Blob)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (image.size === 0 || image.size > MAX_BYTES || image.type !== "image/jpeg") {
    return NextResponse.json({ error: "bad_image" }, { status: 400 });
  }

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const keys = await attemptKeys(request, null, "pay");
  const wait = await waitingFor(admin, keys);
  if (wait > 0) return NextResponse.json({ error: "slow_down", wait }, { status: 429 });

  const found = await openByNumber(admin, input.data.number);
  if (found.kind === "unknown") {
    await recordFailure(admin, keys);
    return NextResponse.json({ error: "unknown" }, { status: 404 });
  }
  if (found.kind === "expired") return NextResponse.json({ error: "expired" }, { status: 410 });

  /* Paying before the first download is allowed: the shop is made now. */
  const shop = await shopFor(admin, found, { tester: isTester(cookies().get(TESTER_COOKIE)?.value) });
  if (!shop.ok) return NextResponse.json({ error: shop.error }, { status: shop.status });

  const { data: business } = await admin.from("businesses").select("id, launch_client").eq("id", shop.businessId).single();
  if (!business) return NextResponse.json({ error: "no_business" }, { status: 404 });

  const bytes = await image.arrayBuffer();
  const path = `serial/${business.id}/${crypto.randomUUID()}.jpg`;
  const upload = await admin.storage.from("payments").upload(path, bytes, { contentType: "image/jpeg" });
  if (upload.error) return NextResponse.json({ error: "not_saved" }, { status: 502 });

  const filed = await filePayment(admin, {
    businessId: business.id,
    launchClient: business.launch_client,
    plan: input.data.plan,
    path,
    bytes,
    app: input.data.app,
    actorId: null,
  });
  if (!filed.ok) return NextResponse.json({ error: filed.error }, { status: filed.status });

  return NextResponse.json({ decision: filed.decision, failures: filed.failures, expected: filed.expected, read: filed.read });
}
