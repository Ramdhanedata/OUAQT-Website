import { z } from "zod";

/*
 * Question banks are data, not code.
 *
 * Each pack's questions live in a versioned JSON file, validated here at build
 * time and again by a test. Adding a question to a pack is editing a file, not
 * writing a component, which is the only way four packs and three languages
 * stay maintainable.
 *
 * Every question carries its own default, because every question offers "Je ne
 * sais pas". A complete set of defaults has to produce working software, and
 * bank.test.ts is what proves it.
 */

export const localisedText = z.object({
  fr: z.string().min(1),
  ar: z.string().min(1),
  en: z.string().min(1),
});

export type LocalisedText = z.infer<typeof localisedText>;

const option = z.object({
  id: z.string().min(1),
  label: localisedText,
});

/*
 * Where an answer lands in the configuration.
 *
 * Without `map` the answer is written as it is. With it, the option the owner
 * chose is looked up, which is how "3 mois" becomes the number 3 without the
 * owner ever meeting a number.
 */
const mapsTo = z.object({
  path: z.string().min(1),
  map: z.record(z.string(), z.unknown()).optional(),
});

const showIf = z.object({
  question: z.string().min(1),
  equals: z.unknown().optional(),
  includes: z.string().optional(),
});

const shared = {
  id: z.string().min(1),
  label: localisedText,
  help: localisedText.optional(),
  /** Still waiting on the owner's review of the Arabic and English wording. */
  review: z.boolean().optional(),
  maps_to: z.array(mapsTo).min(1),
  show_if: showIf.optional(),
};

/*
 * `options_from` exists for one question: how many computers. The ceiling is
 * a licence rule that lives in settings, so the options are built when the
 * question is shown rather than frozen into this file.
 */
const optionsFrom = z.enum(["max_devices"]);

export const question = z.discriminatedUnion("type", [
  z.object({ ...shared, type: z.literal("yes_no"), default: z.boolean() }),
  z.object({
    ...shared,
    type: z.literal("single_choice"),
    options: z.array(option).min(2).optional(),
    options_from: optionsFrom.optional(),
    default: z.union([z.string(), z.number()]),
  }),
  z.object({
    ...shared,
    type: z.literal("multi_choice"),
    options: z.array(option).min(2),
    default: z.array(z.string()).min(1),
  }),
  z.object({
    ...shared,
    type: z.literal("number"),
    min: z.number(),
    max: z.number(),
    default: z.number(),
  }),
  z.object({
    ...shared,
    type: z.literal("short_text"),
    default: z.string(),
  }),
]);

export type Question = z.infer<typeof question>;

export const questionBank = z.object({
  /** "common" for the questions every pack asks, otherwise the pack's name. */
  bank: z.string().min(1),
  version: z.number().int().positive(),
  questions: z.array(question).min(1),
});

export type QuestionBank = z.infer<typeof questionBank>;

export type Answer = boolean | string | number | string[];
export type Answers = Record<string, Answer>;

/** Whether a question applies, given what has been answered so far. */
export function isAsked(item: Question, answers: Answers): boolean {
  const condition = item.show_if;
  if (!condition) return true;

  const earlier = answers[condition.question];
  if (condition.includes !== undefined) {
    return Array.isArray(earlier) && earlier.includes(condition.includes);
  }
  return earlier === condition.equals;
}

/** The answer an owner gets by tapping "Je ne sais pas". */
export function defaultAnswer(item: Question): Answer {
  return item.default;
}

function write(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let node = target;
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== "object" || node[part] === null) node[part] = {};
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

function translate(answer: Answer, rule: z.infer<typeof mapsTo>): unknown {
  if (!rule.map) return answer;
  if (Array.isArray(answer)) {
    return answer.map((one) => (one in rule.map! ? rule.map![one] : one));
  }
  const key = String(answer);
  return key in rule.map ? rule.map[key] : answer;
}

/*
 * Answers on top of a configuration.
 *
 * Questions that do not apply are skipped rather than defaulted, so turning
 * credit off does not quietly leave a credit limit behind.
 */
export function applyAnswers<T extends Record<string, unknown>>(
  configuration: T,
  questions: Question[],
  answers: Answers
): T {
  const next = structuredClone(configuration);

  for (const item of questions) {
    if (!isAsked(item, answers)) continue;
    const answer = item.id in answers ? answers[item.id] : defaultAnswer(item);
    for (const rule of item.maps_to) {
      write(next as Record<string, unknown>, rule.path, translate(answer, rule));
    }
  }
  return next;
}
