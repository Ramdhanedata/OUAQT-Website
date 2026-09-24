"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
 * The handful of controls the interview is built from.
 *
 * They exist so the rules in docs/UI_RULES.md are obeyed once rather than
 * remembered on every screen: nothing to read under 16px, nothing to tap
 * under 48px, every control carrying its own words.
 */

export function Field({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-base font-medium text-foreground">{label}</span>
      {help ? (
        <span className="mt-1 block text-base leading-relaxed text-muted-foreground">
          {help}
        </span>
      ) : null}
      <span className="mt-2 block">{children}</span>
      {error ? (
        <span className="mt-2 block text-base text-destructive">{error}</span>
      ) : null}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  dir,
  inputMode,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  dir?: "ltr" | "rtl";
  inputMode?: "text" | "tel";
  autoComplete?: string;
}) {
  return (
    <input
      type="text"
      dir={dir}
      inputMode={inputMode}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
    />
  );
}

/** A choice the owner taps rather than a dropdown he has to fight. */
export function ChoiceButton({
  selected,
  onClick,
  children,
  note,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-[64px] w-full flex-col justify-center rounded-lg border px-4 py-3 text-start text-base transition-colors",
        selected
          ? "border-foreground bg-foreground/5 font-medium"
          : "border-border hover:border-foreground/40"
      )}
    >
      <span>{children}</span>
      {note ? (
        <span className="mt-1 text-base text-muted-foreground">{note}</span>
      ) : null}
    </button>
  );
}

export function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-xl font-semibold text-foreground">{legend}</legend>
      <div className="mt-4 space-y-3">{children}</div>
    </fieldset>
  );
}
