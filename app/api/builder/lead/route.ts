import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/builder/db/server";
import { packs } from "@/app-ui/packs";

/*
 * "My business is not on this list", and the packs that are not open yet.
 *
 * The table this writes to has row level security on with no policy at all,
 * so a browser cannot reach it however hard it tries. The write happens here,
 * with the service role, which is also the only place a rate limit can live.
 *
 * Only two things are kept: what he says he does, and a phone number to call
 * him back on.
 */

const lead = z.object({
  businessType: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .regex(/^[0-9+\s().-]+$/),
  pack: z.enum(packs).optional(),
});

const A_MINUTE = 60_000; // not-a-rule: the rate limit window
const MOST_PER_MINUTE = 5; // not-a-rule: submissions from one address
const recent = new Map<string, number[]>();

function tooMany(who: string): boolean {
  const now = Date.now();
  const times = (recent.get(who) ?? []).filter((at) => now - at < A_MINUTE);
  times.push(now);
  recent.set(who, times);
  return times.length > MOST_PER_MINUTE;
}

export async function POST(request: Request) {
  const who =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooMany(who)) {
    return NextResponse.json({ error: "slow_down" }, { status: 429 });
  }

  const body = lead.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) {
    // No database configured. Say so plainly; the form then offers WhatsApp
    // rather than pretending the number was taken down.
    return NextResponse.json({ error: "no_database" }, { status: 501 });
  }

  const { error } = await supabase.from("leads_other_business").insert({
    business_type: body.data.pack
      ? `${body.data.pack}: ${body.data.businessType}`
      : body.data.businessType,
    phone: body.data.phone,
  });

  if (error) {
    return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
