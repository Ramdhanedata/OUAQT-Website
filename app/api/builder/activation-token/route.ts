import { NextResponse } from "next/server";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { adminClient, requestClient } from "@/builder/db/server";
import { mintActivationToken, placeOfRequest } from "@/builder/licence/activation-token";

/*
 * The token that lets the software open its shop by itself.
 *
 * Step 4 and the account page ask for one the moment the owner presses the
 * download, saying which system it is for. It keeps a mark of the connection
 * the download came from, so the software, starting on that connection,
 * finds its shop without a serial (see 0024). It is his own shop's, read
 * through his own session, so nobody can ask for a token for a business that
 * is not theirs.
 *
 * The token goes back in this response and nowhere else. It is not logged and
 * it is not audited: an audit row that held it would be a second copy of the
 * thing we took care to keep only the hash of.
 */
export async function POST(request: Request) {
  const asked = (await request.json().catch(() => null)) as { platform?: unknown } | null;
  const platform = asked?.platform === "windows" || asked?.platform === "mac" ? asked.platform : null;
  const supabase = requestClient(request);
  const admin = adminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "no_database" }, { status: 503 });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.is_anonymous) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  /* His own business, read as him. */
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!business) return NextResponse.json({ error: "no_business" }, { status: 404 });

  const secrets = await getPrivateSettings();
  if (!secrets) return NextResponse.json({ error: "not_available" }, { status: 503 });

  const minted = await mintActivationToken(admin, business.id, secrets.activation_token_hours, new Date(), {
    hash: await placeOfRequest(request),
    platform,
  });
  if (!minted) return NextResponse.json({ error: "not_saved" }, { status: 502 });

  return NextResponse.json(
    {
      link: `ouaqt://activate?token=${encodeURIComponent(minted.token)}`,
      expiresAt: minted.expiresAt,
    },
    /* Never cached anywhere between here and his browser. */
    { headers: { "cache-control": "no-store" } }
  );
}
