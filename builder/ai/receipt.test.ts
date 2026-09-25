import { afterEach, describe, expect, it, vi } from "vitest";
import { geminiProvider } from "./gemini";

/*
 * The receipt call, with the network replaced. What matters: the image and
 * the instructions go out and nothing else, and whatever comes back is
 * either a reading or "unavailable", never an exception.
 */

const image = { base64: "AAAA", mimeType: "image/jpeg" };

function answer(payload: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status === 200,
    status,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
      usageMetadata: { promptTokenCount: 300, candidatesTokenCount: 40 },
    }),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reading a payment screenshot with Gemini", () => {
  it("sends the image and the instructions, and nothing about the shop", async () => {
    const fetch = answer({ is_receipt: true, amount: 18000, currency: "MRU", date: "2026-09-19", reference: "T1", recipient: "38087272" });
    vi.stubGlobal("fetch", fetch);

    const outcome = await geminiProvider("key", "model").readReceipt(image);

    const sent = JSON.parse(fetch.mock.calls[0][1].body);
    const parts = sent.contents[0].parts;
    expect(parts).toHaveLength(2);
    expect(parts[1]).toEqual({ inline_data: { mime_type: "image/jpeg", data: "AAAA" } });
    expect(outcome.result).toEqual({
      kind: "read",
      reading: { isReceipt: true, amount: 18000, currency: "MRU", date: "2026-09-19", reference: "T1", recipient: "38087272" },
    });
    expect(outcome.tokensIn).toBe(300);
  });

  it("keeps a field of the wrong kind as not read", async () => {
    vi.stubGlobal("fetch", answer({ is_receipt: true, amount: "18 000", date: 20260919 }));
    const outcome = await geminiProvider("key", "model").readReceipt(image);
    expect(outcome.result).toMatchObject({ kind: "read", reading: { amount: null, date: null } });
  });

  it("says unavailable on an error from the service", async () => {
    vi.stubGlobal("fetch", answer({}, 429));
    const outcome = await geminiProvider("key", "model").readReceipt(image);
    expect(outcome.result).toEqual({ kind: "unavailable", why: "http_429" });
  });

  it("says unavailable when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const outcome = await geminiProvider("key", "model").readReceipt(image);
    expect(outcome.result).toEqual({ kind: "unavailable", why: "network" });
  });
});
