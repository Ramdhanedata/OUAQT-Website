"use client";

import type { AppLanguage } from "@/app-ui/config";
import type { BuilderCopy } from "@/builder/copy";
import type { Answers, Question } from "@/builder/packs/bank";
import { isAsked } from "@/builder/packs/bank";
import type { DraftAnswers } from "@/builder/draft/store";

/*
 * What he has told us, read back to him in his own words before anything is
 * final.
 *
 * Answers are shown as the labels he tapped, never as the values underneath.
 * He chose "3 mois", so he reads "3 mois", not 3 and not expiryAlertMonths.
 */
export function Summary({
  copy,
  language,
  answers,
  questions,
  onEdit,
  bare = false,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  answers: DraftAnswers;
  questions: Question[];
  onEdit: (step: number) => void;
  /* Without its own heading, inside a screen that already has one. */
  bare?: boolean;
}) {
  const given: Answers = answers.interview ?? {};
  /*
   * Which questions applied is judged with the defaults filled in: a question
   * shown because an earlier one kept its default ("Combien de tables ?"
   * after "Sur place" was left as it was) was asked, and belongs here.
   */
  const effective: Answers = Object.fromEntries(questions.map((item) => [item.id, given[item.id] ?? item.default]));
  const asked = questions.filter((item) => isAsked(item, effective));

  return (
    <div className="space-y-8">
      {bare ? null : (
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {copy.summary.heading}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            {copy.summary.intro}
          </p>
        </div>
      )}

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-medium text-foreground">
            {copy.summary.business}
          </h3>
          <button
            type="button"
            onClick={() => onEdit(0)}
            className="min-h-[48px] text-base text-muted-foreground underline decoration-border underline-offset-4"
          >
            {copy.summary.edit}
          </button>
        </div>
        <dl className="mt-2 space-y-2">
          <Line label={copy.name.latin} value={answers.nameLatin} />
          <Line label={copy.name.arabic} value={answers.nameArabic} />
          <Line label={copy.receiptDetails.phone} value={answers.phone} />
          <Line label={copy.receiptDetails.address} value={answers.address} />
        </dl>
      </section>

      <section>
        <h3 className="text-base font-medium text-foreground">
          {copy.summary.answers}
        </h3>
        <dl className="mt-2 space-y-2">
          {asked.map((item) => (
            <Line
              key={item.id}
              label={item.label[language]}
              value={readable(item, given[item.id] ?? item.default, language, copy)}
            />
          ))}
        </dl>
      </section>
    </div>
  );
}

function Line({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-border pb-2">
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className="text-base text-foreground">{value}</dd>
    </div>
  );
}

/** The answer as he saw it on the button he pressed. */
function readable(
  question: Question,
  answer: unknown,
  language: AppLanguage,
  copy: BuilderCopy
): string {
  if (question.type === "yes_no") {
    return answer ? (copy.interview.yes as string) : (copy.interview.no as string);
  }

  if (question.type === "multi_choice") {
    const chosen = Array.isArray(answer) ? answer : [];
    return question.options
      .filter((option) => chosen.includes(option.id))
      .map((option) => option.label[language])
      .join(language === "ar" ? "، " : ", ");
  }

  if (question.type === "single_choice" && question.options) {
    const found = question.options.find(
      (option) => option.id === String(answer)
    );
    return found ? found.label[language] : String(answer);
  }

  return String(answer);
}
