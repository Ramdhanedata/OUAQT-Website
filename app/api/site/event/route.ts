import { NextResponse } from "next/server";
import { z } from "zod";
import { packs } from "@/app-ui/packs";
import { adminClient } from "@/builder/db/server";
import { limitPerCaller } from "@/lib/rate-limit";

/*
 * How many people visit the site, and how many press a download button.
 *
 * The overview's two traffic figures. Like the builder's steps, nothing here
 * says who: the session is a random number the browser tab made up, the
 * page is a path, and the download names a system and a trade. See
 * lib/site-count.ts for the sending side and 0029 for the table.
 */

const body = z
  .object({
    kind: z.enum(["visit", "download"]),
    /* A random id from the tab, not derived from anything about the visitor. */
    session: z.string().min(8).max(64),
    page: z.string().max(200).optional(),
    locale: z.enum(["fr", "ar", "en"]).optional(),
    platform: z.enum(["windows", "mac"]).optional(),
    pack: z.enum(packs).optional(),
    deviceClass: z.enum(["phone", "desktop"]).optional(),
  })
  .strict();

/* Crawlers and link previews are not visitors. */
const ROBOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|facebookexternalhit|whatsapp|telegram/i;

/* A visitor opens a few pages; more than this from one address is not a visitor. */
const tooMany = limitPerCaller(10 * 60_000, 200); // not-a-rule: ten minutes, two hundred pages

export async function POST(request: Request) {
  if (ROBOT.test(request.headers.get("user-agent") ?? "")) return NextResponse.json({ ok: true });
  if (tooMany(request)) return NextResponse.json({ ok: true });
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: true });

  await supabase.from("site_events").insert({
    kind: input.data.kind,
    session_hash: input.data.session,
    page: input.data.page ?? null,
    locale: input.data.locale ?? null,
    platform: input.data.platform ?? null,
    pack: input.data.pack ?? null,
    device_class: input.data.deviceClass ?? null,
  });

  return NextResponse.json({ ok: true });
}
