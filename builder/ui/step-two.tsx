"use client";

import { useEffect } from "react";
import type { AppLanguage } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import type { DraftAnswers } from "@/builder/draft/store";
import { interviewFor } from "@/builder/packs";
import type { Answer } from "@/builder/packs/bank";
import { askedQuestions, StepInterview } from "./step-interview";
import { Summary } from "./summary";

/*
 * Everything step 2 needs, behind one door.
 *
 * The question banks and the validation library live on this side of it. The
 * shell outside does not import them, so an owner reading the first screen of
 * step 1 never downloads the interview, which on a slow phone is the
 * difference between starting and closing the tab.
 *
 * It also owns the counting. How many questions apply depends on the answers
 * given so far, and the shell only needs the number, so it is reported out
 * rather than worked out twice.
 */
export function StepTwo({
  copy,
  language,
  pack,
  answers,
  onAnswer,
  onFeatures,
  onEdit,
  onCount,
  maxDevices,
  screen,
  wide,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  answers: DraftAnswers;
  onAnswer: (id: string, answer: Answer) => void;
  onFeatures: (patch: { common?: unknown; features?: unknown }) => void;
  onEdit: (step: number) => void;
  onCount: (screens: number) => void;
  maxDevices: number | null;
  screen: number;
  wide: boolean;
}) {
  const questions = interviewFor(pack);
  const given = answers.interview ?? {};
  const asked = askedQuestions(questions, given);

  /* One screen per question, then the read back. */
  useEffect(() => {
    onCount(asked.length + 1);
  }, [asked.length, onCount]);

  const interview = (
    <StepInterview
      copy={copy}
      language={language}
      pack={pack}
      questions={questions}
      answers={given}
      onAnswer={onAnswer}
      onFeatures={onFeatures}
      maxDevices={maxDevices}
      screen={screen}
      wide={wide}
    />
  );

  if (!wide && screen < asked.length) return interview;

  return (
    <>
      {wide ? <div className="mb-10">{interview}</div> : null}
      <Summary
        copy={copy}
        language={language}
        answers={answers}
        questions={questions}
        onEdit={onEdit}
      />
    </>
  );
}
