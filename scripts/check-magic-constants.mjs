#!/usr/bin/env node
/*
 * Fails the build when a price, a number of days, or a limit is written into
 * builder code instead of being read from the settings table.
 *
 * Those values change without a deploy: prices, the trial length, how many
 * devices a licence allows, how many releases a year, the payment window. A
 * number typed into a component is a number nobody can change from admin.
 *
 * Skipped: tests, database migrations and seeds (where the values belong),
 * and any line carrying `// not-a-rule`.
 */
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["builder", "app-ui"];
const SKIP = /(\.test\.ts|\.test\.tsx|\/db\/migrations\/|\/db\/seed)/;
const ESCAPE_HATCH = "not-a-rule";

/* Words that turn a nearby number into a rule rather than a measurement. */
const RULE_WORDS =
  /\b(price|prix|tarif|amount|montant|mru|day|days|jour|jours|trial|essai|limit|limite|max|maximum|min|minimum|grace|expiry|peremption|device|devices|poste|postes|release|renew|quota|fee|frais)\b/i;

const offenders = [];

function stripNonCode(line) {
  // Class names and message text hold digits that mean nothing here.
  return line
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

/* trialDays and trial_days both have to read as the words they are made of. */
function splitNames(line) {
  return line.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}

function check(file) {
  fs.readFileSync(file, "utf8")
    .split("\n")
    .forEach((raw, index) => {
      if (raw.includes(ESCAPE_HATCH)) return;
      const line = stripNonCode(raw);
      if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) return;

      const numbers = [...line.matchAll(/(?<![\w.])(\d+(?:\.\d+)?)(?![\w.])/g)]
        .map((match) => Number(match[1]))
        .filter((value) => ![0, 1].includes(value));

      if (numbers.length === 0) return;
      const looksLikeMoney = numbers.some((value) => value >= 100);
      if (looksLikeMoney || RULE_WORDS.test(splitNames(line))) {
        offenders.push(
          `${file}:${index + 1}  ${raw.trim().slice(0, 100)}`
        );
      }
    });
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full) && !SKIP.test(full)) check(full);
  }
}

ROOTS.forEach(walk);

if (offenders.length) {
  console.error(
    `\nThese numbers look like prices, durations or limits. Read them from settings,\n` +
      `or add // ${ESCAPE_HATCH} to the line if the number is genuinely fixed.\n`
  );
  offenders.forEach((line) => console.error("  " + line));
  process.exit(1);
}

console.log(`No hardcoded prices, durations or limits in ${ROOTS.join(", ")}.`);
