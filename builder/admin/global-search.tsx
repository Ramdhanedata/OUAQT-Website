"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { LicenceStatus } from "@/app-ui/licence-status";
import { fill } from "@/lib/utils";
import type { AdminCopy } from "./copy";
import { NO_LICENCE_COLOR, STATUS_COLOR } from "./status-colors";

/*
 * Find a customer from any admin page, by whatever is to hand: a name, a
 * phone, a serial, the code on the computer's screen. Answers arrive as
 * staff type; arrows move, Enter opens, Escape closes, and "/" anywhere on
 * the page jumps here.
 */

type Hit = {
  id: string;
  name: string;
  nameArabic: string | null;
  pack: string;
  status: LicenceStatus | null;
  matched: string | null;
};

export type SearchWords = {
  t: AdminCopy["search"];
  packs: Record<string, string>;
  statuses: Record<string, string>;
  noLicence: string;
};

const WAIT_MS = 200; // not-a-rule: typing pause before asking

export function GlobalSearch({ words, autoFocus }: { words: SearchWords; autoFocus?: boolean }) {
  const { t } = words;
  const router = useRouter();
  const listId = useId();
  const field = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  /* "/" focuses the box, unless somebody is already typing somewhere. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        field.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const typed = query.trim();
    if (!typed) {
      setHits([]);
      setTotal(0);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true);
      const answer = await fetch(`/api/admin/search?q=${encodeURIComponent(typed)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null);
      if (controller.signal.aborted) return;
      setBusy(false);
      setHits((answer?.results as Hit[]) ?? []);
      setTotal((answer?.total as number) ?? 0);
      setActive(-1);
    }, WAIT_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function go(href: string) {
    setOpen(false);
    field.current?.blur();
    router.push(href);
  }

  const allHref = `/admin/clients?q=${encodeURIComponent(query.trim())}`;
  const showing = open && query.trim().length > 0;

  return (
    <div className="relative">
      <label className="flex h-11 items-center gap-3 rounded-xl border border-border bg-background px-3 focus-within:border-foreground">
        <Search aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={field}
          type="search"
          value={query}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showing}
          aria-controls={listId}
          aria-label={t.placeholder}
          placeholder={t.placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, hits.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, -1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (active >= 0 && hits[active]) go(`/admin/clients/${hits[active].id}`);
              else if (query.trim()) go(allHref);
            } else if (event.key === "Escape") {
              setOpen(false);
              field.current?.blur();
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded border border-border px-1.5 text-xs text-muted-foreground sm:inline">/</kbd>
      </label>

      {showing ? (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          {busy && hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">{t.searching}</p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">{t.none}</p>
          ) : (
            <ul id={listId} role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
              {hits.map((hit, index) => (
                <li key={hit.id} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(`/admin/clients/${hit.id}`)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-start ${index === active ? "bg-foreground/5" : ""}`}
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: hit.status ? STATUS_COLOR[hit.status] : NO_LICENCE_COLOR }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-foreground">
                        {hit.name}
                        {hit.nameArabic ? (
                          <span className="font-normal text-muted-foreground">
                            {" · "}
                            <bdi dir="rtl" lang="ar">
                              {hit.nameArabic}
                            </bdi>
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {words.packs[hit.pack] ?? hit.pack}
                        {hit.matched && hit.matched !== "name" ? ` · ${fill(t.by, { what: t.matched[hit.matched] ?? hit.matched })}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {hit.status ? words.statuses[hit.status] ?? hit.status : words.noLicence}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {total > 0 ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => go(allHref)}
              className="block w-full border-t border-border px-4 py-2.5 text-start text-sm font-medium text-foreground hover:bg-foreground/5"
            >
              {fill(t.all, { count: total })}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
