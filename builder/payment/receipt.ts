import type { ReceiptReading } from "@/builder/ai/provider";
import type { Extracted } from "./checks";

/*
 * What the model read, made into something the checks can trust the shape
 * of. A field that is not what it should be becomes null, which the checks
 * treat as "not read" rather than as wrong: a person looks at the image.
 *
 * not-a-rule-file: the ouguiya's own arithmetic and the length of a phone
 * number, not anything anybody administers.
 */

/* The old ouguiya, still printed by some apps, is a tenth of the new one. */
const OLD_OUGUIYA = /^(MRO|UM\s*ancien|ancienne?\s*ouguiya)/i;
const OLD_PER_NEW = 10;

/* A Mauritanian number has eight digits; fewer is not a number we can compare. */
const PHONE_DIGITS = 8;
const MAX_REFERENCE = 60;

export function receiptFrom(reading: ReceiptReading): Extracted {
  const amount =
    reading.amount !== null && Number.isFinite(reading.amount) && reading.amount > 0
      ? OLD_OUGUIYA.test(reading.currency?.trim() ?? "")
        ? reading.amount / OLD_PER_NEW
        : reading.amount
      : null;

  /* A real day only: the 31st of February comes back as a different date. */
  const written = reading.date?.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
  const date = written && realDay(written) ? written : null;

  const reference = reading.reference?.trim().replace(/\s+/g, " ").slice(0, MAX_REFERENCE) || null;

  const digits = reading.recipient?.replace(/\D/g, "") ?? "";
  const recipient = digits.length >= PHONE_DIGITS ? digits : null;

  return { isReceipt: reading.isReceipt, amountMru: amount, date, reference, recipient };
}

function realDay(written: string): boolean {
  const parsed = new Date(`${written}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(written);
}
