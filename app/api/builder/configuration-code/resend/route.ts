import { NextResponse } from "next/server";
import { z } from "zod";
import { phoneKey } from "@/builder/config-code/code";
import { attemptKeys, recordFailure, waitingFor } from "@/builder/config-code/server";
import { adminClient, requestClient } from "@/builder/db/server";
import { sendConfigurationCode } from "@/builder/notify/whatsapp";

/*
 * "Vous avez perdu votre code ?": the phone number used during the
 * questions, and the code is sent again to that number.
 *
 * The code is never shown on screen from a phone number alone, and the
 * answer is the same whether the number was found or not, so this cannot be
 * used to learn who configured what. Until the WhatsApp send is connected,
 * the request is queued in the admin area for staff to send by hand.
 */

const body = z.object({ phone: z.string().trim().max(30) }).strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const supabase = requestClient(request);
  const admin = adminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "no_database" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();

  const keys = await attemptKeys(request, auth.user?.id ?? null, "resend");
  const wait = await waitingFor(admin, keys);
  if (wait > 0) return NextResponse.json({ error: "slow_down", wait }, { status: 429 });

  const phone = phoneKey(input.data.phone);
  if (!phone) return NextResponse.json({ ok: true });

  const { data: draft } = await admin
    .from("builder_drafts")
    .select("id, code, locale")
    .eq("phone", phone)
    .not("code", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  /* Asking again and again for numbers that are not there counts as guessing. */
  if (!draft) {
    await recordFailure(admin, keys);
    return NextResponse.json({ ok: true });
  }

  const language = draft.locale === "ar" || draft.locale === "en" ? draft.locale : "fr";
  const sent = await sendConfigurationCode({ phone, code: draft.code as string, language });
  await admin.from("configuration_code_requests").insert({ draft_id: draft.id, phone, sent: sent.sent, handled_at: sent.sent ? new Date().toISOString() : null });
  return NextResponse.json({ ok: true });
}
