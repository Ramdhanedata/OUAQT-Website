import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appLanguages,
  defaultConfiguration,
  type Configuration,
} from "@/app-ui/config";
import { packs } from "@/app-ui/packs";
import { aiProvider, applyPatch } from "@/builder/ai";
import { aiBudgetLeft } from "@/builder/ai/budget";
import { limitPerCaller } from "@/lib/rate-limit";
import { adminClient } from "@/builder/db/server";
import { applyAnswers } from "@/builder/packs/bank";
import { interviewFor } from "@/builder/packs";

/*
 * "Expliquer avec mes mots": the owner writes a sentence instead of choosing.
 *
 * What arrives here is the question, his sentence, and the switches set so
 * far. Not his shop's name, not his phone number, not his logo, not his
 * products. The browser does not send them and the route could not forward
 * them if it wanted to.
 *
 * Whatever happens next, the owner is not blocked. No key, a timeout, a
 * refused patch: the answer stays the question's default and his sentence is
 * kept as a feature request, which is a better record of what he needed than
 * a half-applied guess would be.
 */

const body = z.object({
  pack: z.enum(packs),
  language: z.enum(appLanguages),
  questionId: z.string().min(1),
  freeText: z.string().trim().min(2).max(500),
  /* The answers so far, by question id. Nothing about the shop itself. */
  answers: z.record(z.string(), z.unknown()).default({}),
});

/*
 * The switches as they stand, rebuilt here from his answers rather than sent
 * up from the browser. The browser holds his name, his logo and his products
 * in the same object, and the surest way to keep those out of a request is
 * for the request never to carry a configuration at all.
 */
function stub(input: z.infer<typeof body>): Configuration {
  const base = {
    ...defaultConfiguration(input.pack, input.language),
    business: { nameLatin: "-" },
  };
  return applyAnswers(
    base,
    interviewFor(input.pack),
    input.answers as Record<string, never>
  );
}

async function remember(
  outcome: string,
  tokensIn: number,
  tokensOut: number,
  latencyMs: number
) {
  const supabase = adminClient();
  if (!supabase) return;
  await supabase.from("ai_calls").insert({
    purpose: "interview",
    outcome,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    latency_ms: latencyMs,
  });
}

async function keep(
  pack: string,
  questionId: string,
  text: string
) {
  const supabase = adminClient();
  if (!supabase) return;
  await supabase.from("feature_requests").insert({
    pack,
    question_id: questionId,
    text,
  });
}

/* An owner explains a handful of answers in his own words; a loop sends hundreds. */
const tooMany = limitPerCaller(10 * 60_000, 20); // not-a-rule: ten minutes, twenty sentences

export async function POST(request: Request) {
  if (tooMany(request)) return NextResponse.json({ error: "slow_down" }, { status: 429 });
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const question = interviewFor(input.data.pack).find(
    (item) => item.id === input.data.questionId
  );
  if (!question) {
    return NextResponse.json({ error: "unknown_question" }, { status: 404 });
  }

  const provider = aiProvider();
  /* No key, or the day's budget spent: his sentence is kept for a person, and he carries on. */
  if (!provider || !(await aiBudgetLeft())) {
    await keep(input.data.pack, question.id, input.data.freeText);
    return NextResponse.json({ outcome: "noted" });
  }

  const allowedPaths = question.maps_to.map((rule) => rule.path);
  const { result, tokensIn, tokensOut, latencyMs } = await provider.interpret({
    question: {
      id: question.id,
      label: question.label[input.data.language],
      type: question.type,
      options:
        "options" in question && question.options
          ? question.options.map((option) => ({
              id: option.id,
              label: option.label[input.data.language],
            }))
          : undefined,
      allowedPaths,
    },
    freeText: input.data.freeText,
    configuration: stub(input.data),
    language: input.data.language,
  });

  if (result.kind === "patch") {
    /*
     * An empty patch is not a success. The model answered without changing
     * anything, and telling the owner "done" while nothing moved is worse
     * than telling him it was noted, because he will not think to check.
     */
    if (Object.keys(result.patch).length === 0) {
      await remember("empty_patch", tokensIn, tokensOut, latencyMs);
      await keep(input.data.pack, question.id, input.data.freeText);
      return NextResponse.json({ outcome: "noted" });
    }

    const applied = applyPatch(stub(input.data), result.patch, allowedPaths);
    if (applied.ok) {
      await remember("applied", tokensIn, tokensOut, latencyMs);
      return NextResponse.json({
        outcome: "applied",
        common: applied.configuration.common,
        features: applied.configuration.features,
        confirmation: result.confirmation,
      });
    }
    // The model answered, but not with something the schema accepts. The
    // owner keeps the default and we keep his sentence.
    await remember(`rejected_${applied.reason}`, tokensIn, tokensOut, latencyMs);
    await keep(input.data.pack, question.id, input.data.freeText);
    return NextResponse.json({ outcome: "noted" });
  }

  await remember(result.kind, tokensIn, tokensOut, latencyMs);
  await keep(input.data.pack, question.id, input.data.freeText);
  return NextResponse.json({ outcome: "noted" });
}
