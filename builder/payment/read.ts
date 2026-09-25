import "server-only";

import { aiProvider, mayReadImages } from "@/builder/ai";
import { adminClient } from "@/builder/db/server";
import type { Extracted } from "./checks";
import { receiptFrom } from "./receipt";

/*
 * Reading the screenshot: whether it is a transfer at all, the amount, the
 * date, the transaction number and the number the money went to.
 *
 * Only when mayReadImages() says so, which is the paid tier. On the free one
 * a transfer receipt does not go to a free endpoint, which is the brief's
 * rule: the image stays in our private storage and a person reads it in the
 * admin area. A reading that fails or runs out of time is not a refusal
 * either. The payment goes to a person, like any other.
 */
export async function readReceipt(bytes: ArrayBuffer): Promise<Extracted> {
  if (!mayReadImages()) return null;
  const provider = aiProvider();
  if (!provider) return null;

  const { result, tokensIn, tokensOut, latencyMs } = await provider.readReceipt({
    base64: Buffer.from(bytes).toString("base64"),
    mimeType: "image/jpeg",
  });

  /* Counted with the interview's calls, so the cost page sees both. */
  await adminClient()
    ?.from("ai_calls")
    .insert({
      purpose: "receipt",
      outcome: result.kind === "read" ? "read" : result.why,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: latencyMs,
    });

  return result.kind === "read" ? receiptFrom(result.reading) : null;
}
