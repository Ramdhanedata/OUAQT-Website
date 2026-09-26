import { NextResponse } from "next/server";
import { z } from "zod";
import { phoneKey } from "@/builder/config-code/code";
import { attemptKeys, recordFailure, waitingFor } from "@/builder/config-code/server";
import { adminClient, requestClient } from "@/builder/db/server";
import { sendNumber } from "@/builder/notify/whatsapp";
import { decryptSerial } from "@/builder/serial/cipher";

/*
 * "Vous avez perdu votre numéro ?": the phone number used during the
 * questions, and the numéro de série is sent again to that phone.
 *
 * The number is never shown on screen from a phone number alone, and the
 * answer is the same whether the phone was found or not, so this cannot be
 * used to learn who configured what. Until the WhatsApp send is connected,
 * the request is queued in the admin area for staff to send by hand.
 */

const body = z.object({ phone: z.string().trim().max(30) }).strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const supabase = await requestClient(request);
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
    .select("id, serial_cipher, locale")
    .eq("phone", phone)
    .not("serial_hash", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const serial = draft?.serial_cipher ? await decryptSerial(draft.serial_cipher) : null;

  /* Asking again and again for phones that are not there counts as guessing. */
  if (!draft || !serial) {
    await recordFailure(admin, keys);
    return NextResponse.json({ ok: true });
  }

  const language = draft.locale === "ar" || draft.locale === "en" ? draft.locale : "fr";
  const sent = await sendNumber({ phone, serial, language });
  await admin.from("configuration_code_requests").insert({ draft_id: draft.id, phone, sent: sent.sent, handled_at: sent.sent ? new Date().toISOString() : null });
  return NextResponse.json({ ok: true });
}
