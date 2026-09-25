import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isTester, TESTER_COOKIE } from "@/builder/admin/tester";
import { phoneKey } from "@/builder/config-code/code";
import { followDraft, keepLogo, numberFor } from "@/builder/config-code/server";
import { adminClient, requestClient } from "@/builder/db/server";
import { sendNumber } from "@/builder/notify/whatsapp";
import { serialSecretIsSet } from "@/builder/serial/cipher";

/*
 * The owner's numéro de série, the moment the questions are done.
 *
 * For the browser's own draft, found through its own session: a visitor can
 * only ever get a number for the configuration he is answering. Asking twice
 * returns the same number, so a reload or a second tap does not change it.
 * No shop exists yet; it is made the first time the number is used.
 *
 * The number is sent on WhatsApp to the number he gave, without asking him.
 * Until that send is connected the answer says so, and the screen does not
 * pretend a message went out. See builder/notify/whatsapp.ts.
 */

const body = z
  .object({
    language: z.enum(["fr", "ar", "en"]),
    /* A phone number given on this screen, when the questions had none. */
    phone: z.string().trim().max(30).optional(),
    logo: z.string().max(2_000_000).optional(),
    logoMono: z.string().max(2_000_000).optional(),
    /* He removed his logo. Sent only then: a logo missing because it stayed on another device is not a removal. */
    removeLogo: z.boolean().optional(),
  })
  .strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = requestClient(request);
  const admin = adminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "no_database" }, { status: 503 });
  if (!serialSecretIsSet()) return NextResponse.json({ error: "no_serial_secret" }, { status: 501 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "no_session" }, { status: 401 });

  const { data: draft } = await admin
    .from("builder_drafts")
    .select("id, session_owner, serial_cipher, answers, phone, logo_path, logo_mono_path, made_in_test_mode, business_id")
    .eq("session_owner", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!draft) return NextResponse.json({ error: "no_draft" }, { status: 404 });

  const serial = await numberFor(admin, draft);
  if (!serial) return NextResponse.json({ error: "not_saved" }, { status: 502 });

  const answers = (draft.answers ?? {}) as { phone?: string };
  const phone = phoneKey(input.data.phone) ?? phoneKey(answers.phone) ?? draft.phone ?? null;
  if (phone && phone !== draft.phone) await admin.from("builder_drafts").update({ phone }).eq("id", draft.id);

  /*
   * Staff answering on a phone in test mode: the shop this number makes gets
   * the same test-mode trial, on whichever computer. The cookie is signed by
   * the server and set only from the admin area.
   */
  if (!draft.made_in_test_mode && isTester(cookies().get(TESTER_COOKIE)?.value)) {
    await admin.from("builder_drafts").update({ made_in_test_mode: true }).eq("id", draft.id);
  }

  /*
   * The logo he has now, kept every time the number is asked for: an owner
   * who changes his logo and finishes again gets the new one, on the draft
   * and, when his shop already exists, on the shop, for the app to pick up.
   */
  if (input.data.logo && input.data.logoMono) {
    const kept = await keepLogo(admin, auth.user.id, draft.id, input.data.logo, input.data.logoMono, {
      colourPath: draft.logo_path,
      monoPath: draft.logo_mono_path,
    });
    if (kept && (kept.colourPath !== draft.logo_path || kept.monoPath !== draft.logo_mono_path)) {
      await admin.from("builder_drafts").update({ logo_path: kept.colourPath, logo_mono_path: kept.monoPath }).eq("id", draft.id);
    }
  }
  if (input.data.removeLogo && !input.data.logo && (draft.logo_path || draft.logo_mono_path)) {
    const stale = [draft.logo_path, draft.logo_mono_path].filter((path): path is string => Boolean(path));
    await admin.storage.from("logos").remove(stale);
    await admin.from("builder_drafts").update({ logo_path: null, logo_mono_path: null }).eq("id", draft.id);
  }
  if (draft.business_id) await followDraft(admin, draft.business_id);

  const sent = await sendNumber({ phone, serial, language: input.data.language });

  return NextResponse.json(
    { serial, sent: sent.sent, hasPhone: Boolean(phone) },
    { headers: { "cache-control": "no-store" } }
  );
}
