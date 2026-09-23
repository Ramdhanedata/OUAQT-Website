import { NextResponse } from "next/server";
import { z } from "zod";
import { makeConfigurationCode, phoneKey } from "@/builder/config-code/code";
import { keepLogo } from "@/builder/config-code/server";
import { adminClient, requestClient } from "@/builder/db/server";
import { sendConfigurationCode } from "@/builder/notify/whatsapp";

/*
 * Issuing the code de configuration, the moment the questions are done.
 *
 * For the browser's own draft, found through its own session: a visitor can
 * only ever get a code for the configuration he is answering. Asking twice
 * returns the same code, so a reload or a second tap does not change it.
 *
 * The code is sent on WhatsApp to the number he gave, without asking him.
 * Until that send is connected the answer says so, and the screen does not
 * pretend a message went out. See builder/notify/whatsapp.ts.
 */

const body = z
  .object({
    language: z.enum(["fr", "ar", "en"]),
    /* A number given on the code screen, when the questions had none. */
    phone: z.string().trim().max(30).optional(),
    logo: z.string().max(2_000_000).optional(),
    logoMono: z.string().max(2_000_000).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = requestClient(request);
  const admin = adminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "no_session" }, { status: 401 });

  const { data: draft } = await admin
    .from("builder_drafts")
    .select("id, code, answers, phone, logo_path")
    .eq("session_owner", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!draft) return NextResponse.json({ error: "no_draft" }, { status: 404 });

  const answers = (draft.answers ?? {}) as { phone?: string };
  const phone = phoneKey(input.data.phone) ?? phoneKey(answers.phone) ?? draft.phone ?? null;

  let code = draft.code as string | null;
  if (!code) {
    /* Six hundred billion possibilities; a clash is retried, never shared. */
    for (let attempt = 0; attempt < 5 && !code; attempt += 1) {
      const candidate = makeConfigurationCode();
      const { error } = await admin
        .from("builder_drafts")
        .update({ code: candidate, phone, last_accessed_at: new Date().toISOString(), status: "active" })
        .eq("id", draft.id)
        .is("code", null);
      if (!error) code = candidate;
    }
    if (!code) return NextResponse.json({ error: "not_saved" }, { status: 502 });
  } else if (phone && phone !== draft.phone) {
    await admin.from("builder_drafts").update({ phone }).eq("id", draft.id);
  }

  if (!draft.logo_path && input.data.logo && input.data.logoMono) {
    const kept = await keepLogo(admin, auth.user.id, draft.id, input.data.logo, input.data.logoMono);
    if (kept) await admin.from("builder_drafts").update({ logo_path: kept.colourPath, logo_mono_path: kept.monoPath }).eq("id", draft.id);
  }

  const sent = await sendConfigurationCode({ phone, code, language: input.data.language });

  return NextResponse.json(
    { code, sent: sent.sent, hasPhone: Boolean(phone) },
    { headers: { "cache-control": "no-store" } }
  );
}
