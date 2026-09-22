import { NextResponse } from "next/server";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { adminClient, requestClient } from "@/builder/db/server";
import { mintActivationToken } from "@/builder/licence/activation-token";

/*
 * The one-click activation link, for an owner who built on the shop PC.
 *
 * Step 4 asks for one when it sees a computer rather than a phone. It is his
 * own shop's, read through his own session, so nobody can ask for a token for
 * a business that is not theirs.
 *
 * The token goes back in this response and nowhere else. It is not logged and
 * it is not audited: an audit row that held it would be a second copy of the
 * thing we took care to keep only the hash of.
 */
export async function POST(request: Request) {
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

  const minted = await mintActivationToken(admin, business.id, secrets.activation_token_hours);
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
