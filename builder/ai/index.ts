import "server-only";

import { geminiProvider } from "./gemini";
import type { AiProvider } from "./provider";

/*
 * Which model answers, and what it is allowed to look at.
 *
 * Both are environment variables rather than code, so moving from the free
 * tier to a paid one, or from Gemini to something else, is a setting and a
 * redeploy, never an edit here.
 *
 * With no key at all there is no provider, and the builder carries on exactly
 * as it does when the model times out: the question keeps its default and the
 * owner's sentence is kept as a feature request. The AI is never in the way.
 */

const DEFAULT_MODEL = "gemini-3.6-flash";

export type AiTier = "free" | "paid";

export function aiTier(): AiTier {
  return process.env.AI_TIER === "paid" ? "paid" : "free";
}

/*
 * Whether a payment screenshot may be sent to the model to be read.
 *
 * Until 2026-09-25 only on the paid tier. Adel's decision that day: on every
 * tier, so an owner is told at once whether his payment went through. On the
 * free tier the provider may keep what it is sent and use it to improve its
 * products, and the privacy page says so. The one switch stays here.
 */
export function mayReadImages(): boolean {
  return true;
}

export function aiProvider(): AiProvider | null {
  const key = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!key) return null;

  const provider = (process.env.AI_PROVIDER ?? "gemini").trim();
  const model = (process.env.AI_MODEL ?? DEFAULT_MODEL).trim();

  switch (provider) {
    case "gemini":
      return geminiProvider(key, model);
    default:
      return null;
  }
}

export * from "./provider";
export * from "./patch";
