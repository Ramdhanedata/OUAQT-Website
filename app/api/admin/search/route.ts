import { NextResponse } from "next/server";
import { adminGate } from "@/builder/admin/guard";
import { latestLicences, shopStatus, type LicenceRow } from "@/builder/admin/overview-math";
import { findShops } from "@/builder/admin/search";
import { adminClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";

/*
 * The search box at the top of every admin page, answering as staff type.
 *
 * The first few shops that match, each with its licence state and what it
 * matched on, so the list can say "by phone" beside a name that does not
 * obviously fit. The full list is the clients page with the same words.
 */

const SHOWN = 8; // not-a-rule: how many answers fit under the box

export async function GET(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const query = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!query) return NextResponse.json({ results: [], total: 0 });

  const found = await findShops(supabase, query);
  const first = found.slice(0, SHOWN);
  const ids = first.map((one) => one.shop.id);

  const [settings, { data: licenceRows }] = await Promise.all([
    getPublicSettings(),
    ids.length
      ? supabase
          .from("licences")
          .select("business_id, plan, status, starts_at, ends_at, created_at")
          .in("business_id", ids)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const now = new Date();
  const rules = { renewalGraceDays: settings?.renewal_grace_days ?? 0 };
  const licences = latestLicences((licenceRows ?? []) as LicenceRow[]);

  return NextResponse.json({
    total: found.length,
    results: first.map(({ shop, matched }) => ({
      id: shop.id,
      name: shop.name_latin,
      nameArabic: shop.name_arabic,
      pack: shop.pack,
      status: shopStatus(licences.get(shop.id), now, rules),
      matched,
    })),
  });
}
