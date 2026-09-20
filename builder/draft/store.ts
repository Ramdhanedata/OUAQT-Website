"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Pack } from "@/app-ui/packs";
import type { AppLanguage } from "@/app-ui/config";
import type { Answers } from "@/builder/packs/bank";
import { browserClient, ensureAnonymousSession } from "@/builder/db/client";

/*
 * Keeping the owner's answers, on a phone that may lose the network mid
 * sentence.
 *
 * Two places, on purpose. The device keeps a copy so reopening the page is
 * instant and works with no signal at all; the server keeps one so he can
 * carry on from another phone once he has an account. The device copy is
 * written first and always, and the server copy follows when it can.
 *
 * The logo is the exception. It is the one answer measured in hundreds of
 * kilobytes, and pushing it up again after every keystroke on a slow
 * connection would be unkind. It stays on the device until the account step
 * uploads it once.
 */

export type DraftAnswers = {
  pack?: Pack;
  builderLanguage?: AppLanguage;
  appLanguage?: AppLanguage;
  nameLatin?: string;
  nameArabic?: string;
  phone?: string;
  address?: string;
  logo?: string;
  logoMono?: string;
  /* Step 2: one entry per question the owner answered. */
  interview?: Answers;
  /*
   * Step 3's staff list. A few names, so it belongs in the draft and survives
   * a reload. The product list does not: ten thousand rows have no business
   * in a browser's storage, and they are written to the database the moment
   * there is an account to attach them to.
   */
  staff?: { name: string; role: "manager" | "cashier" }[];
  /*
   * What the AI worked out from a sentence he wrote, already validated
   * against the schema on the server. Kept apart from `interview` because it
   * is a configuration fragment rather than an answer to a question.
   */
  patched?: { common?: unknown; features?: unknown };
};

export type SaveState = "idle" | "saving" | "saved" | "failed" | "local";

const LOCAL_KEY = "ouaqt.builder.draft";
const SETTLE_MS = 800; // not-a-rule: how long typing pauses before we save

type Stored = { answers: DraftAnswers; step: number };

function readLocal(): Stored | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function writeLocal(value: Stored) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(value));
  } catch {
    // A full or blocked storage is not a reason to stop the interview.
  }
}

/** Everything but the logo: what is worth sending after every answer. */
function forServer(answers: DraftAnswers): DraftAnswers {
  const { logo: _logo, logoMono: _logoMono, ...rest } = answers;
  return rest;
}

export function useDraft(locale: string) {
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const [step, setStep] = useState(0);
  const [state, setState] = useState<SaveState>("idle");
  const [restored, setRestored] = useState(false);

  const draftId = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* What the device remembers comes back before anything is asked of the network. */
  useEffect(() => {
    const local = readLocal();
    if (local) {
      setAnswers(local.answers);
      setStep(local.step);
    }
    setRestored(true);
  }, []);

  /* Then, if there is a database, whatever the server has for this owner. */
  useEffect(() => {
    if (!restored) return;
    let cancelled = false;

    (async () => {
      const supabase = await ensureAnonymousSession();
      if (!supabase) {
        setState("local");
        return;
      }
      const { data } = await supabase
        .from("builder_drafts")
        .select("id, answers, step")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled || !data) return;
      draftId.current = data.id;

      /*
       * The device copy wins when it has more in it: it holds the logo, and it
       * is the one the owner was looking at a moment ago.
       */
      const local = readLocal();
      const localCount = Object.keys(local?.answers ?? {}).length;
      const serverCount = Object.keys(data.answers ?? {}).length;
      if (serverCount > localCount) {
        setAnswers(data.answers as DraftAnswers);
        setStep(data.step ?? 0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [restored]);

  const save = useCallback(
    async (next: DraftAnswers, nextStep: number) => {
      const supabase = await browserClient();
      if (!supabase) {
        setState("local");
        return;
      }

      setState("saving");
      const session = await supabase.auth.getSession();
      const owner = session.data.session?.user.id;
      if (!owner) {
        setState("failed");
        return;
      }

      const row = {
        session_owner: owner,
        pack: next.pack ?? null,
        locale,
        step: nextStep,
        answers: forServer(next),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = draftId.current
        ? await supabase
            .from("builder_drafts")
            .update(row)
            .eq("id", draftId.current)
            .select("id")
            .single()
        : await supabase.from("builder_drafts").insert(row).select("id").single();

      if (error) {
        setState("failed");
        return;
      }
      draftId.current = data.id;
      setState("saved");
    },
    [locale]
  );

  /** Record an answer: the device now, the server once typing stops. */
  const update = useCallback(
    (patch: DraftAnswers, nextStep = step) => {
      setAnswers((current) => {
        const next = { ...current, ...patch };
        writeLocal({ answers: next, step: nextStep });
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void save(next, nextStep), SETTLE_MS);
        return next;
      });
      setStep(nextStep);
    },
    [save, step]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { answers, step, setStep, update, state, restored };
}
