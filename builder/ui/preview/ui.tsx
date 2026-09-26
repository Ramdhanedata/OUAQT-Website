"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { formatMoney, type AppLanguage } from "@/app-ui";
import { cn } from "@/lib/utils";

/*
 * The pieces every preview screen is built from, drawn the way the desktop
 * app draws them: ivory grounds, hairline edges, ink for the one thing that
 * matters on the screen, and nothing to press smaller than a finger.
 *
 * The preview is laid out at a laptop's size and scaled down as a whole, so
 * the sizes here are the app's real ones.
 */

export function Screen({
  title,
  aside,
  children,
}: {
  title: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-4 border-b border-app-line px-7">
        <h1 className="truncate text-[26px] font-semibold text-app-ink">{title}</h1>
        {aside ? <div className="flex shrink-0 items-center gap-3">{aside}</div> : null}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  kind = "outline",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "outline" | "gold" | "quiet";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg px-5 text-[17px] font-medium transition-colors disabled:cursor-not-allowed",
        kind === "primary" && "bg-app-ink text-app-surface hover:bg-app-ink2 disabled:bg-app-strong disabled:text-app-surface",
        kind === "outline" && "border-2 border-app-strong bg-app-raised text-app-ink hover:bg-app-hover disabled:opacity-50",
        kind === "gold" && "bg-app-gold text-app-ink hover:brightness-95 disabled:opacity-50",
        kind === "quiet" && "text-app-ink2 underline-offset-4 hover:underline",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-[48px] shrink-0 whitespace-nowrap rounded-full border-2 px-6 text-[17px]",
        selected ? "border-app-ink bg-app-ink font-semibold text-app-surface" : "border-app-strong bg-app-raised text-app-ink hover:bg-app-hover"
      )}
    >
      {children}
    </button>
  );
}

export function Stat({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: "warning" | "danger" }) {
  return (
    <div className="rounded-xl border border-app-line bg-app-raised px-5 py-4">
      <div className="text-[16px] text-app-ink3">{label}</div>
      <div
        className={cn(
          "mt-1 text-[28px] font-bold tabular-nums",
          tone === "warning" ? "text-app-warning" : tone === "danger" ? "text-app-danger" : "text-app-ink"
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function Tag({ tone, children }: { tone: "warning" | "danger" | "success" | "neutral" | "gold"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-0.5 text-[15px] font-semibold",
        tone === "warning" && "bg-app-warning-soft text-app-warning",
        tone === "danger" && "bg-app-danger-soft text-app-danger",
        tone === "success" && "bg-app-success-soft text-app-success",
        tone === "neutral" && "bg-app-hover text-app-ink2",
        tone === "gold" && "bg-app-warning-soft text-app-gold-ink"
      )}
    >
      {children}
    </span>
  );
}

export function Money({ value, language, className }: { value: number; language: AppLanguage; className?: string }) {
  return (
    <bdi dir="ltr" className={cn("tabular-nums", className)}>
      {formatMoney(value, language)}
    </bdi>
  );
}

/*
 * A table the way the app lays out its lists: a quiet heading row, then rows
 * with room between them. Columns are a CSS grid template, so every screen
 * keeps its own proportions.
 */
export function Table({
  columns,
  head,
  rows,
}: {
  columns: string;
  head: ReactNode[];
  rows: { key: string; cells: ReactNode[]; strong?: boolean; onClick?: () => void }[];
}) {
  return (
    <div className="px-7 pb-6">
      <div
        className="grid items-center gap-4 border-b border-app-line py-3 text-[15px] font-medium text-app-ink3"
        style={{ gridTemplateColumns: columns }}
      >
        {head.map((cell, index) => (
          <div key={index} className={index === head.length - 1 ? "text-end" : undefined}>
            {cell}
          </div>
        ))}
      </div>
      {rows.map((row) => {
        const Row = row.onClick ? "button" : "div";
        return (
          <Row
            key={row.key}
            type={row.onClick ? "button" : undefined}
            onClick={row.onClick}
            className={cn(
              "grid min-h-[60px] w-full items-center gap-4 border-b border-app-line py-3 text-start text-[17px] text-app-ink",
              row.strong && "font-semibold",
              row.onClick && "hover:bg-app-hover"
            )}
            style={{ gridTemplateColumns: columns }}
          >
            {row.cells.map((cell, index) => (
              <div key={index} className={cn("min-w-0", index === row.cells.length - 1 && "text-end")}>
                {cell}
              </div>
            ))}
          </Row>
        );
      })}
    </div>
  );
}

/*
 * A dialog inside the app window, never over the website: the preview is a
 * picture of the app, and the app's dialogs belong to it.
 */
export function Dialog({
  title,
  onClose,
  children,
  wide,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-30 flex animate-fade-in items-center justify-center bg-black/35 p-10" onClick={onClose}>
      <div
        role="dialog"
        className={cn("max-h-full overflow-auto rounded-2xl bg-app-surface p-7 shadow-2xl", wide ? "w-[820px]" : "w-[520px]")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-[24px] font-semibold text-app-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-app-ink2 hover:bg-app-hover"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[16px] text-app-ink2">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[52px] w-full rounded-lg border-2 border-app-strong bg-app-raised px-4 text-[18px] text-app-ink outline-none focus:border-app-ink"
      />
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-7 py-10 text-center text-[18px] text-app-ink3">{children}</p>;
}
