"use client";

import type { AppLanguage } from "@/app-ui/config";
import type { BuilderCopy } from "@/builder/copy";
import { isAsked, withDefaults, type Answer, type Answers, type Question } from "@/builder/packs/bank";
import { fill } from "@/lib/utils";
import { ChoiceButton, Field, TextInput } from "./fields";

/*
 * Step 2: two or three questions.
 *
 * One at a time on a phone, the whole list on a computer. Each opens with its
 * usual answer already chosen, so an owner who is unsure just presses
 * Continue and still ends up with software that works. Nothing else sits
 * under a question: it is read, answered, and left behind.
 */

type Props = {
  copy: BuilderCopy;
  language: AppLanguage;
  questions: Question[];
  answers: Answers;
  onAnswer: (id: string, answer: Answer) => void;
  screen: number;
  wide: boolean;
};

/** The questions that apply, given what has been answered so far and what is already chosen. */
export function askedQuestions(questions: Question[], answers: Answers): Question[] {
  const effective = withDefaults(questions, answers);
  return questions.filter((item) => isAsked(item, effective));
}

export function StepInterview(props: Props) {
  const { wide, screen } = props;
  const asked = askedQuestions(props.questions, props.answers);

  if (wide) {
    return (
      <div className="space-y-10">
        {asked.map((item) => (
          <OneQuestion key={item.id} {...props} question={item} />
        ))}
      </div>
    );
  }

  const item = asked[Math.min(screen, asked.length - 1)];
  if (!item) return null;

  return (
    <div className="space-y-6">
      <p className="text-base text-muted-foreground">
        {fill(props.copy.interview.questionOf as string, {
          current: Math.min(screen + 1, asked.length),
          total: asked.length,
        })}
      </p>
      <OneQuestion {...props} question={item} />
    </div>
  );
}

function OneQuestion({
  copy,
  language,
  question,
  answers,
  onAnswer,
}: Props & { question: Question }) {
  const current = answers[question.id] ?? question.default;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold leading-snug text-foreground">
        {question.label[language]}
      </h2>
      {question.help ? (
        <p className="text-base leading-relaxed text-muted-foreground">
          {question.help[language]}
        </p>
      ) : question.type === "multi_choice" ? (
        <p className="text-base leading-relaxed text-muted-foreground">
          {copy.interview.pickAny}
        </p>
      ) : null}

      <Controls
        copy={copy}
        language={language}
        question={question}
        value={current}
        onAnswer={(answer) => onAnswer(question.id, answer)}
      />
    </div>
  );
}

function Controls({
  copy,
  language,
  question,
  value,
  onAnswer,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  question: Question;
  value: Answer;
  onAnswer: (answer: Answer) => void;
}) {
  if (question.type === "yes_no") {
    return (
      <div className="space-y-3">
        <ChoiceButton selected={value === true} onClick={() => onAnswer(true)}>
          {copy.interview.yes}
        </ChoiceButton>
        <ChoiceButton selected={value === false} onClick={() => onAnswer(false)}>
          {copy.interview.no}
        </ChoiceButton>
      </div>
    );
  }

  if (question.type === "single_choice") {
    return (
      <div className="space-y-3">
        {question.options.map((option) => (
          <ChoiceButton
            key={option.id}
            selected={String(value) === option.id}
            onClick={() => onAnswer(option.id)}
          >
            {option.label[language]}
          </ChoiceButton>
        ))}
      </div>
    );
  }

  if (question.type === "multi_choice") {
    const chosen = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-3">
        {question.options.map((option) => (
          <ChoiceButton
            key={option.id}
            selected={chosen.includes(option.id)}
            onClick={() => {
              const next = chosen.includes(option.id)
                ? chosen.filter((one) => one !== option.id)
                : [...chosen, option.id];
              // An empty answer is not an answer; the last choice stays.
              onAnswer(next.length > 0 ? next : chosen);
            }}
          >
            {option.label[language]}
          </ChoiceButton>
        ))}
      </div>
    );
  }

  if (question.type === "number") {
    return (
      <Field label="">
        <TextInput
          dir="ltr"
          inputMode="tel"
          value={String(value ?? "")}
          onChange={(text) => {
            const parsed = Number(text.replace(/[^\d]/g, ""));
            if (!Number.isNaN(parsed)) {
              onAnswer(Math.min(question.max, Math.max(question.min, parsed)));
            }
          }}
        />
      </Field>
    );
  }

  return (
    <Field label="">
      <TextInput value={String(value ?? "")} onChange={(text) => onAnswer(text)} />
    </Field>
  );
}
