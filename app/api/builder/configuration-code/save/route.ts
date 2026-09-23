import { NextResponse } from "next/server";
import { z } from "zod";
import { normaliseConfigurationCode } from "@/builder/config-code/code";
import { attemptKeys, openByCode, recordFailure, waitingFor } from "@/builder/config-code/server";
import { adminClient, requestClient } from "@/builder/db/server";

/*
 * Saving a change made on the computer, into the configuration the code
 * points to. The code is the permission: whoever holds it can change what it
 * points to, which is what it is for. Without this, a fix made on the
 * computer would be lost the next time the code is opened.
 */

const body = z
  .object({
    code: z.string().max(40),
    answers: z.record(z.string(), z.unknown()),
    step: z.number().int().min(0).max(10),
  })
  .strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "no_database" }, { status: 503 });

  /* The same slow-down as opening a code: a wrong one here is a guess too. */
  const session = await requestClient(request)?.auth.getUser();
  const keys = await attemptKeys(request, session?.data.user?.id ?? null, "resume");
  const wait = await waitingFor(admin, keys);
  if (wait > 0) return NextResponse.json({ error: "slow_down", wait }, { status: 429 });

  const found = await openByCode(admin, normaliseConfigurationCode(input.data.code));
  if (found.kind === "unknown") await recordFailure(admin, keys);
  if (found.kind !== "found") return NextResponse.json({ error: found.kind }, { status: found.kind === "expired" ? 410 : 404 });

  /* The logo is never carried in the answers: it lives in storage. */
  const answers = Object.fromEntries(Object.entries(input.data.answers).filter(([key]) => key !== "logo" && key !== "logoMono"));
  const { error } = await admin
    .from("builder_drafts")
    .update({
      answers,
      pack: typeof answers.pack === "string" ? answers.pack : found.draft.pack,
      step: input.data.step,
      updated_at: new Date().toISOString(),
    })
    .eq("id", found.draft.id);
  if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
