import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isTester, TESTER_COOKIE } from "@/builder/admin/tester";
import { adminClient, sessionClient } from "@/builder/db/server";
import { createShop, shopInput } from "@/builder/licence/create-shop";
import { decryptSerial, serialSecretIsSet } from "@/builder/serial/cipher";

/*
 * The end of the interview: a business, a configuration, and the number he
 * will type into the shop computer.
 *
 * Who writes what, and why the split matters:
 *
 *   as the owner   his business, his products, his staff. These are his, row
 *                  level security checks every one, and he can edit them.
 *
 *   as the server  the configuration and the serial. Those tables are select
 *                  only for owners on purpose. The configuration is what the
 *                  desktop app runs on and the serial is what activates it, so
 *                  neither may be written by a browser holding a public key.
 *                  They are written here, after validation, or not at all.
 *
 * Calling it twice does not make a second business. A retry after a failure
 * returns what the first attempt built.
 */

export async function POST(request: Request) {
  const input = shopInput.safeParse(await request.json().catch(() => null));
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
  if (!owner) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  if (!serialSecretIsSet()) {
    // Without it the serial could be shown once and never again, which is a
    // worse promise than refusing now.
    return NextResponse.json({ error: "no_serial_secret" }, { status: 501 });
  }

  /*
   * The logo went up when the questions ended, onto his draft, and so was his
   * numéro de série given: the shop is made with that same number, so the
   * one on his phone is the one the software asks for.
   */
  const { data: draft } = await admin
    .from("builder_drafts")
    .select("id, logo_path, logo_mono_path, serial_cipher")
    .eq("session_owner", owner.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const made = await createShop(admin, owner.id, input.data, {
    tester: isTester((await cookies()).get(TESTER_COOKIE)?.value),
    logo: draft?.logo_path && draft.logo_mono_path ? { colourPath: draft.logo_path, monoPath: draft.logo_mono_path } : null,
    serial: draft?.serial_cipher ? await decryptSerial(draft.serial_cipher) : null,
  });
  if (!made.ok) return NextResponse.json({ error: made.error }, { status: made.status });

  if (draft && made.created) {
    await admin.from("builder_drafts").update({ business_id: made.businessId }).eq("id", draft.id);
  }

  return NextResponse.json({ businessId: made.businessId, serial: made.serial });
}
