"use client";

import { useState } from "react";
import { fill } from "@/lib/utils";
import type { AdminCopy } from "./copy";

/*
 * One setting, one field, one save.
 *
 * Values are shown and typed as JSON because that is what they are: a number,
 * a piece of text in quotes, a list. Staff editing prices will see 15000 and
 * type 16000, which is the common case and reads as itself.
 */
export function SettingRow({
  settingKey,
  value,
  description,
  t,
}: {
  settingKey: string;
  value: string;
  description: string | null;
  t: AdminCopy["settings"];
}) {
  const [text, setText] = useState(value);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [problem, setProblem] = useState<string | null>(null);

  async function save() {
    setState("saving");
    setProblem(null);

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: settingKey, value: text }),
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setState("failed");
      setProblem(
        body?.error === "not_json"
          ? t.notJson
          : body?.error === "wrong_kind"
            ? fill(t.wrongKind, { was: String(body.was) })
            : t.notSaved
      );
      return;
    }
    setState("saved");
  }

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <code className="text-base text-foreground">{settingKey}</code>
        {state === "saved" ? (
          <span className="text-base text-muted-foreground">{t.saved}</span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-1 text-base text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-2 flex gap-3">
        <input
          type="text"
          dir="ltr"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setState("idle");
          }}
          className="min-h-[48px] flex-1 rounded-lg border border-border bg-background px-4 font-mono text-base text-foreground outline-none focus:border-foreground"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={state === "saving" || text === value}
          className="min-h-[48px] rounded-lg border border-border px-5 text-base text-foreground disabled:opacity-40"
        >
          {t.save}
        </button>
      </div>
      {problem ? <p className="mt-2 text-base text-destructive">{problem}</p> : null}
    </li>
  );
}
