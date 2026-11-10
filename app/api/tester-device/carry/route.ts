import { NextResponse } from "next/server";
import { adminClient } from "@/builder/db/server";
import { holderOf, passCookieOf } from "@/builder/licence/tester-pass";

/*
 * The pass of a test iPhone's browser (0040), handed back to its own page so
 * the phone app's link can carry it into the icon added from there (see
 * builder/licence/tester-pass-shared.ts). It answers only a browser that
 * already holds a pass still on the list, with that same pass: it tells
 * nobody anything they did not have.
 */
export async function GET(request: Request) {
  const pass = passCookieOf(request);
  const supabase = adminClient();
  const holder = supabase && pass ? await holderOf(supabase, pass) : null;
  if (!holder || !pass) return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
  return NextResponse.json({ tp: pass }, { headers: { "cache-control": "no-store" } });
}
