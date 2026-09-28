"use client";

import { cn } from "@/lib/utils";
import {
  languageCookie,
  languageCookieSeconds,
  localeNames,
  localeShortNames,
  locales,
  withLocale,
  type Locale,
} from "@/lib/i18n/config";
import { Check, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/*
 * Language switcher. Each option is a real link to the same page under another
 * locale prefix, so switching keeps you on the page you were reading and the
 * new language is server rendered. No flash of the wrong language.
 */
export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/" || locales.some((option) => pathname === `/${option}`);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
        {localeShortNames[locale]}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-11 z-50 min-w-[9rem] overflow-hidden rounded-xl border border-border bg-background p-1 shadow-xl shadow-black/20"
        >
          {locales.map((option) => {
            const props = {
              role: "menuitem",
              lang: option,
              dir: option === "ar" ? "rtl" : "ltr",
              className: cn(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                option === locale
                  ? "text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              ),
            } as const;
            const label = (
              <>
                {localeNames[option]}
                {option === locale && <Check className="h-3.5 w-3.5" />}
              </>
            );
            return onHome ? (
              /*
               * The home page stays at the bare address: the choice is
               * remembered and the page loads again in it, rather than moving
               * to ouaqt.com/ar.
               */
              // eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load, so the middleware reads the new choice
              <a key={option} {...props} href="/" onClick={() => rememberLanguage(option)}>
                {label}
              </a>
            ) : (
              <Link key={option} {...props} href={withLocale(pathname, option)} onClick={() => setOpen(false)}>
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function rememberLanguage(locale: Locale) {
  document.cookie = `${languageCookie}=${locale}; path=/; max-age=${languageCookieSeconds}; samesite=lax`;
}
