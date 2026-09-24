"use client";

import { useState } from "react";
import type { AppLanguage } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { isAsked, type Answer, type Answers, type Question } from "@/builder/packs/bank";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/utils";
import { ChoiceButton, Field, TextInput } from "./fields";

/*
 * Step 2: the interview.
 *
 * One question at a time on a phone, the whole list on a computer. Every
 * question can be answered with "Je ne sais pas", which takes its default and
 * moves on, so an owner who is unsure of everything still ends up with
 * software that works.
 *
 * Under each question is a way out of the multiple choice: he writes what he
 * actually does, in his own words. That goes to the AI, and when the AI
 * cannot turn it into a setting, the question keeps its default and his
 * sentence is kept as something we should build.
 */

type Props = {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  questions: Question[];
  answers: Answers;
  onAnswer: (id: string, answer: Answer) => void;
  onFeatures: (patch: { common?: unknown; features?: unknown }) => void;
  maxDevices: number | null;
  screen: number;
  wide: boolean;
};

/** The questions that apply, given what has been answered so far. */
export function askedQuestions(questions: Question[], answers: Answers): Question[] {
  return questions.filter((item) => isAsked(item, answers));
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
  pack,
  question,
  answers,
  onAnswer,
  onFeatures,
  maxDevices,
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
      ) : null}

      <Controls
        copy={copy}
        language={language}
        question={question}
        value={current}
        maxDevices={maxDevices}
        onAnswer={(answer) => onAnswer(question.id, answer)}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={() => onAnswer(question.id, question.default)}
          className="min-h-[48px] text-base text-muted-foreground underline decoration-border underline-offset-4"
        >
          {copy.interview.dontKnow}
        </button>
      </div>

      <InOwnWords
        copy={copy}
        language={language}
        pack={pack}
        questionId={question.id}
        answers={answers}
        onFeatures={onFeatures}
      />
    </div>
  );
}

function Controls({
  copy,
  language,
  question,
  value,
  maxDevices,
  onAnswer,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  question: Question;
  value: Answer;
  maxDevices: number | null;
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
    /*
     * How many computers is a licence rule, so the choices are built from
     * settings rather than written into the question bank. If the ceiling
     * moves, this question moves with it.
     */
    const options =
      question.options?.map((option) => ({
        id: option.id,
        label: option.label[language],
      })) ??
      Array.from({ length: Math.max(1, maxDevices ?? 1) }, (_, index) => ({
        id: String(index + 1),
        label: String(index + 1),
      }));

    return (
      <div className="space-y-3">
        {options.map((option) => (
          <ChoiceButton
            key={option.id}
            selected={String(value) === option.id}
            onClick={() =>
              onAnswer(question.options ? option.id : Number(option.id))
            }
          >
            {option.label}
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

function InOwnWords({
  copy,
  language,
  pack,
  questionId,
  answers,
  onFeatures,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  questionId: string;
  answers: Answers;
  onFeatures: (patch: { common?: unknown; features?: unknown }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "applied" | "noted">(
    "idle"
  );
  const [confirmation, setConfirmation] = useState("");

  async function send() {
    setState("sending");
    try {
      const response = await fetch("/api/builder/interpret", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pack,
          language,
          questionId,
          freeText: text,
          answers,
        }),
      });
      const body = await response.json().catch(() => null);

      if (body?.outcome === "applied") {
        onFeatures({ common: body.common, features: body.features });
        setConfirmation(body.confirmation ?? "");
        setState("applied");
        return;
      }
      setState("noted");
    } catch {
      // The network went while he was typing. His sentence is not lost, but
      // nothing pretends to have understood it either.
      setState("noted");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[48px] text-base text-muted-foreground underline decoration-border underline-offset-4"
      >
        {copy.interview.explain}
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <Field label={copy.interview.explain} help={copy.interview.explainHelp}>
        <TextInput value={text} onChange={setText} />
      </Field>

      {state === "applied" && confirmation ? (
        <p className="text-base leading-relaxed text-foreground">{confirmation}</p>
      ) : null}
      {state === "noted" ? (
        <p className="text-base leading-relaxed text-muted-foreground">
          {copy.interview.noted}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={() => void send()}
        disabled={text.trim().length < 2 || state === "sending"}
      >
        {state === "sending" ? copy.interview.sending : copy.interview.send}
      </Button>
    </div>
  );
}
