import { NextResponse } from "next/server";
import { z } from "zod";
import { packs } from "@/app-ui/packs";
import { adminClient } from "@/builder/db/server";
import { limitPerCaller } from "@/lib/rate-limit";

/*
 * Where owners get to, and where they stop.
 *
 * The only thing worth knowing about a builder nobody finishes is which
 * screen they close it on, so each step reaching the screen is recorded. What
 * is not recorded is who: no phone number, no name, no shop. The session is a
 * random number the browser made up, and it means nothing outside this table.
 */

const body = z
  .object({
    /* A random id from the browser, not derived from anything about him. */
    session: z.string().min(8).max(64),
    pack: z.enum(packs).optional(),
    step: z.number().int().min(0).max(10),
    event: z.enum(["reached", "left", "finished"]),
    deviceClass: z.enum(["phone", "desktop"]),
  })
  .strict();

/* A visit records a few steps; more than this from one address is not a visit. */
const tooMany = limitPerCaller(10 * 60_000, 120); // not-a-rule: ten minutes, a hundred and twenty steps

export async function POST(request: Request) {
  if (tooMany(request)) return NextResponse.json({ ok: true });
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ ok: true });

  await supabase.from("builder_events").insert({
    session_hash: input.data.session,
    pack: input.data.pack ?? null,
    step: input.data.step,
    event: input.data.event,
    device_class: input.data.deviceClass,
  });

  return NextResponse.json({ ok: true });
}
