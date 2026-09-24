/*
 * Who gets a free trial, and who only looks as though he has had one.
 *
 * Nothing in this file touches a database or a request, so every rule below
 * can be tested with plain values. The thresholds arrive as arguments because
 * they live in the settings table, not here.
 *
 * The tone matters as much as the rule. A refusal is a door to a person, not
 * a verdict: everything here produces a reason code, and every reason code
 * has a sentence in the copy that offers WhatsApp.
 */

/**
 * A machine, in three salted hashes. The app computes them from the
 * motherboard, the system disk and the operating system's own machine id, and
 * sends only these. We never see a serial number.
 */
export type Fingerprint = {
  board: string | null;
  disk: string | null;
  machine: string | null;
};

export type Claim = {
  businessId: string;
  fingerprint: Fingerprint;
  phone: string | null;
  logoHash: string | null;
  productsHash: string | null;
  name: string;
  address: string | null;
};

export type TrialRules = {
  onePerFingerprint: boolean;
  onePerPhone: boolean;
  requireFingerprint: boolean;
  fingerprintPartsToMatch: number;
  similarityPercent: number;
};

export type Refusal =
  | "same_machine"
  | "same_phone"
  | "same_business"
  | "no_fingerprint";

export type Decision = { allowed: true } | { allowed: false; because: Refusal };

/*
 * Two fingerprints are the same machine when enough of their parts still
 * agree. A disk dies and is replaced, a motherboard is swapped under warranty
 * and the machine id survives a reinstall or does not: any one of the three
 * can change on a machine that is honestly the same one, and all three
 * changing is a different computer.
 */
export function sameMachine(
  a: Fingerprint,
  b: Fingerprint,
  partsToMatch: number
): boolean {
  let agree = 0;
  if (a.board && a.board === b.board) agree += 1;
  if (a.disk && a.disk === b.disk) agree += 1;
  if (a.machine && a.machine === b.machine) agree += 1;
  return agree >= partsToMatch;
}

/** Digits only, so +222 38 08 72 72 and 38087272 are one number. */
export function samePhone(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const digits = (value: string) => value.replace(/\D/g, "");
  return digits(a) !== "" && digits(a) === digits(b);
}

/**
 * Whether this shop may start a trial, given every trial claimed before.
 *
 * The business check has no setting behind it: a shop gets one trial, and a
 * second device joining the same shop is not a second trial. The other two
 * are rules that can be turned off, because one of them may turn out to hurt
 * more honest owners than it stops dishonest ones.
 */
export function trialAllowed(
  candidate: Claim,
  past: Claim[],
  rules: TrialRules
): Decision {
  const hasFingerprint = Boolean(
    candidate.fingerprint.board ||
      candidate.fingerprint.disk ||
      candidate.fingerprint.machine
  );
  if (rules.requireFingerprint && !hasFingerprint) {
    return { allowed: false, because: "no_fingerprint" };
  }

  for (const earlier of past) {
    if (earlier.businessId === candidate.businessId) {
      return { allowed: false, because: "same_business" };
    }
    if (
      rules.onePerFingerprint &&
      hasFingerprint &&
      sameMachine(candidate.fingerprint, earlier.fingerprint, rules.fingerprintPartsToMatch)
    ) {
      return { allowed: false, because: "same_machine" };
    }
    if (rules.onePerPhone && samePhone(candidate.phone, earlier.phone)) {
      return { allowed: false, because: "same_phone" };
    }
  }

  return { allowed: true };
}

/* ── The softer signals, which never refuse anything ─────────────────────── */

export type Signal = "same_logo" | "same_products" | "similar_name" | "similar_address";

/**
 * What this trial has in common with earlier ones.
 *
 * None of it blocks anybody. Two pharmacies on the same street have similar
 * names, and a man who opens a second shop is a customer, not a fraud. It is
 * written down so a person can look, which is the only thing that should
 * decide something this easy to get wrong.
 */
export function repeatSignals(
  candidate: Claim,
  past: Claim[],
  rules: Pick<TrialRules, "similarityPercent">
): Signal[] {
  const found = new Set<Signal>();

  for (const earlier of past) {
    if (earlier.businessId === candidate.businessId) continue;

    if (candidate.logoHash && candidate.logoHash === earlier.logoHash) {
      found.add("same_logo");
    }
    if (candidate.productsHash && candidate.productsHash === earlier.productsHash) {
      found.add("same_products");
    }
    if (similarity(candidate.name, earlier.name) >= rules.similarityPercent) {
      found.add("similar_name");
    }
    if (
      candidate.address &&
      earlier.address &&
      similarity(candidate.address, earlier.address) >= rules.similarityPercent
    ) {
      found.add("similar_address");
    }
  }

  return [...found];
}

/*
 * How alike two pieces of text look, from 0 to 100.
 *
 * Accents, case and spacing are removed first, because "Pharmacie El Waha"
 * and "pharmacie el-waha" are the same shop written twice.
 */
export function similarity(a: string, b: string): number {
  const left = flatten(a);
  const right = flatten(b);
  if (!left || !right) return 0;
  if (left === right) return 100;

  const longest = Math.max(left.length, right.length);
  const distance = editDistance(left, right);
  return Math.round(((longest - distance) / longest) * 100); // not-a-rule: per cent
}

function flatten(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/* Levenshtein, one row at a time: these are shop names, not documents. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    previous = current;
  }

  return previous[b.length];
}
