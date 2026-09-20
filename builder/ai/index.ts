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
 * On the free tier the model reads the owner's words and nothing else. A
 * payment screenshot is an image of a bank transfer, and it is not going to a
 * free endpoint, so B4 asks for the transaction reference instead and sends
 * the payment to be confirmed by hand.
 */
export function mayReadImages(): boolean {
  return aiTier() === "paid";
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
