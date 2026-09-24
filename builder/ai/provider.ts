import type { AppLanguage, Configuration } from "@/app-ui/config";
import type { Patch } from "./patch";

/*
 * The AI's whole job, described in one file.
 *
 * It reads one question, the owner's own sentence about it, and the switches
 * set so far. It answers with a patch, or it says the pack cannot do what he
 * is asking. It is never asked to write text for the app, generate code, or
 * decide anything the owner did not raise.
 *
 * Swapping Gemini for another provider means adding a file next to this one
 * and changing AI_PROVIDER. Nothing else in the builder knows which model is
 * behind it, or whether there is one at all.
 */

export type Interpretation =
  | { kind: "patch"; patch: Patch; confirmation: string }
  /** The owner asked for something this pack does not do. */
  | { kind: "unsupported"; wanted: string }
  /** No key, a timeout, a refusal, anything. The question falls back to its default. */
  | { kind: "unavailable"; why: string };

export type AskedQuestion = {
  id: string;
  label: string;
  type: string;
  options?: { id: string; label: string }[];
  allowedPaths: string[];
};

export type InterpretRequest = {
  question: AskedQuestion;
  freeText: string;
  configuration: Configuration;
  language: AppLanguage;
};

export type InterpretOutcome = {
  result: Interpretation;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
};

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  interpret(request: InterpretRequest): Promise<InterpretOutcome>;
}

/*
 * What the model is allowed to see.
 *
 * The owner's name, his phone number, his address, his logo and his product
 * list never leave this building. The model gets the switches and nothing
 * that identifies the shop, which is a rule in the brief and a test in
 * provider.test.ts.
 */
export function shareable(configuration: Configuration) {
  return {
    pack: configuration.pack,
    language: configuration.language.app,
    common: configuration.common,
    features: configuration.features,
  };
}
