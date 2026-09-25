import type {
  AiProvider,
  InterpretOutcome,
  InterpretRequest,
  ReceiptOutcome,
} from "./provider";
import { shareable } from "./provider";

/*
 * Gemini, behind the adapter.
 *
 * Fifteen seconds and no more: the owner is standing in his shop and the
 * question has a perfectly good default waiting. A slow answer is the same as
 * no answer, and both end the same way, with the default and the interview
 * moving on.
 */

const TIMEOUT_MS = 15_000; // not-a-rule: the brief's ceiling on one AI call
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/*
 * The model answers in this shape or not at all. Asking for JSON in prose and
 * hoping is how you end up parsing an apology.
 *
 * The patch is asked for as a string rather than an object, which looks
 * backwards and is not. A structured-output object with no declared
 * properties comes back empty every time, so the patch arrived as {} and the
 * owner was told his answer had been applied while nothing had changed. The
 * paths differ per question, so they cannot be declared here.
 */
const responseSchema = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["patch", "unsupported"] },
    patch_json: {
      type: "string",
      description:
        'A JSON object as text, keys being full configuration paths, for example {"features.pharmacy.search":["name","barcode"]}',
    },
    confirmation: {
      type: "string",
      description: "One short sentence, in the owner's language",
    },
    wanted: {
      type: "string",
      description: "What the owner asked for, when the pack cannot do it",
    },
  },
  required: ["action"],
};

/** Reads a dotted path out of the configuration, for showing the model where it stands. */
function valueAt(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (node, key) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[key]
          : undefined,
      source
    );
}

function instructions(request: InterpretRequest): string {
  const { question, configuration, language } = request;

  return [
    "You are helping a shop owner set up his own management software.",
    "He answered a question in his own words. Turn that into a change to his configuration, or say the software cannot do it.",
    "",
    `The question: ${question.label}`,
    question.options?.length
      ? `Its choices: ${question.options.map((o) => `${o.id} (${o.label})`).join(", ")}`
      : "",
    `Paths you may set, and no others: ${question.allowedPaths.join(", ")}`,
    "",
    `His configuration so far: ${JSON.stringify(shareable(configuration))}`,
    "",
    'Answer with action "patch". Put the change in patch_json as JSON text, keys being full paths from the list above, for example {"features.pharmacy.search":["name","barcode"]}.',
    `Their current values: ${JSON.stringify(
      Object.fromEntries(
        question.allowedPaths.map((path) => [path, valueAt(configuration, path)])
      )
    )}`,
    "Keep what he already has where he confirms it, and add what he describes.",
    `Write the confirmation in ${language === "ar" ? "Arabic" : language === "en" ? "English" : "French"}, in shop words, never technical ones.`,
    'If he is asking for something outside those paths, answer with action "unsupported" and put what he asked for in "wanted".',
    "Never invent a path. Never answer about medicines, regulation, taxes or the law.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function geminiProvider(apiKey: string, model: string): AiProvider {
  return {
    name: "gemini",
    model,

    async interpret(request: InterpretRequest): Promise<InterpretOutcome> {
      const started = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `${ENDPOINT}/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: instructions(request) },
                    { text: `His words: ${request.freeText}` },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema,
                temperature: 0,
              },
            }),
          }
        );

        if (!response.ok) {
          return outcome(
            { kind: "unavailable", why: `http_${response.status}` },
            started
          );
        }

        const body = await response.json();
        const usage = body.usageMetadata ?? {};
        const text = (body.candidates?.[0]?.content?.parts ?? [])
          .map((part: { text?: string }) => part.text ?? "")
          .join("");

        let answer: {
          action?: string;
          patch_json?: string;
          confirmation?: string;
          wanted?: string;
        };
        try {
          answer = JSON.parse(text);
        } catch {
          return outcome({ kind: "unavailable", why: "unparsable" }, started, usage);
        }

        if (answer.action === "unsupported") {
          return outcome(
            { kind: "unsupported", wanted: answer.wanted ?? request.freeText },
            started,
            usage
          );
        }

        if (answer.action === "patch" && answer.patch_json) {
          let patch: Record<string, unknown>;
          try {
            patch = JSON.parse(answer.patch_json);
          } catch {
            return outcome({ kind: "unavailable", why: "unparsable_patch" }, started, usage);
          }
          return outcome(
            {
              kind: "patch",
              patch,
              confirmation: answer.confirmation ?? "",
            },
            started,
            usage
          );
        }

        return outcome({ kind: "unavailable", why: "no_action" }, started, usage);
      } catch (error) {
        const why =
          error instanceof Error && error.name === "AbortError"
            ? "timeout"
            : "network";
        return outcome({ kind: "unavailable", why }, started);
      } finally {
        clearTimeout(timer);
      }
    },

    readReceipt: (image) => readReceipt(apiKey, model, image),
  };
}

/*
 * Reading a transfer confirmation. Longer than a sentence takes, since it is
 * an image, and still short: the owner is on the page waiting, and a reading
 * that does not come back in time only means a person reads it instead.
 */
const RECEIPT_TIMEOUT_MS = 20_000; // not-a-rule: an image takes longer than a sentence

const receiptSchema = {
  type: "object",
  properties: {
    is_receipt: {
      type: "boolean",
      description: "True when the image confirms a money transfer that went through",
    },
    amount: {
      type: "number",
      nullable: true,
      description: "The amount sent, without fees, as a plain number",
    },
    currency: {
      type: "string",
      nullable: true,
      description: "The currency as written next to the amount, for example MRU or MRO",
    },
    date: {
      type: "string",
      nullable: true,
      description: "The date of the transfer, as YYYY-MM-DD",
    },
    reference: {
      type: "string",
      nullable: true,
      description: "The transaction number or reference, exactly as written",
    },
    recipient: {
      type: "string",
      nullable: true,
      description: "The phone or account number the money was sent to, digits only",
    },
  },
  required: ["is_receipt"],
};

const RECEIPT_INSTRUCTIONS = [
  "This image should be a screenshot of a money transfer confirmation from a Mauritanian payment app: Bankily, Masrvi, BimBank, SEDAD or Click.",
  "Its text may be in French, Arabic or English. Read only what is written on it. Never guess.",
  "Set is_receipt to false when the image is not a transfer confirmation, or when it shows a transfer that failed or is still waiting.",
  "amount: the amount sent, not the fees and not a balance. Spaces, dots or commas between groups of three digits separate thousands.",
  "date: these apps write the day before the month, so 05/09/2026 is the 5th of September 2026, written 2026-09-05.",
  "recipient: the number the money went to, not the sender's.",
  "Leave any field you cannot read as null.",
].join("\n");

async function readReceipt(
  apiKey: string,
  model: string,
  image: { base64: string; mimeType: string }
): Promise<ReceiptOutcome> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RECEIPT_TIMEOUT_MS);
  const done = (result: ReceiptOutcome["result"], usage: Usage = {}): ReceiptOutcome => ({
    result,
    tokensIn: usage.promptTokenCount ?? 0,
    tokensOut: usage.candidatesTokenCount ?? 0,
    latencyMs: Date.now() - started,
  });

  try {
    const response = await fetch(`${ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: RECEIPT_INSTRUCTIONS },
              { inline_data: { mime_type: image.mimeType, data: image.base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: receiptSchema,
          temperature: 0,
        },
      }),
    });
    if (!response.ok) return done({ kind: "unavailable", why: `http_${response.status}` });

    const body = await response.json();
    const usage: Usage = body.usageMetadata ?? {};
    const text = (body.candidates?.[0]?.content?.parts ?? [])
      .map((part: { text?: string }) => part.text ?? "")
      .join("");

    let answer: Record<string, unknown>;
    try {
      answer = JSON.parse(text);
    } catch {
      return done({ kind: "unavailable", why: "unparsable" }, usage);
    }

    const asText = (value: unknown) => (typeof value === "string" ? value : null);
    return done(
      {
        kind: "read",
        reading: {
          isReceipt: typeof answer.is_receipt === "boolean" ? answer.is_receipt : null,
          amount: typeof answer.amount === "number" ? answer.amount : null,
          currency: asText(answer.currency),
          date: asText(answer.date),
          reference: asText(answer.reference),
          recipient: asText(answer.recipient),
        },
      },
      usage
    );
  } catch (error) {
    const why = error instanceof Error && error.name === "AbortError" ? "timeout" : "network";
    return done({ kind: "unavailable", why });
  } finally {
    clearTimeout(timer);
  }
}

type Usage = { promptTokenCount?: number; candidatesTokenCount?: number };

function outcome(
  result: InterpretOutcome["result"],
  started: number,
  usage: { promptTokenCount?: number; candidatesTokenCount?: number } = {}
): InterpretOutcome {
  return {
    result,
    tokensIn: usage.promptTokenCount ?? 0,
    tokensOut: usage.candidatesTokenCount ?? 0,
    latencyMs: Date.now() - started,
  };
}
