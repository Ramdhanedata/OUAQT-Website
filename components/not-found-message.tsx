"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

/*
 * The 404 message, in the language of the address that was not found, like
 * the header and footer around it: /ar/... answers in Arabic. The language is
 * read in the browser, from the address, because not-found.tsx cannot read
 * the route's params, and reading the language cookie on the server instead
 * turned every page under /[lang] into one rendered on each request.
 */
export function NotFoundMessage({ copy }: { copy: Record<Locale, Dictionary["notFound"]> }) {
  const first = usePathname()?.split("/")[1] ?? "";
  const text = copy[isLocale(first) ? first : defaultLocale];

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium tracking-tight text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {text.heading}
      </h1>
      <p className="mt-4 max-w-sm text-muted-foreground">{text.body}</p>
      <div className="mt-8">
        <Button href="/" variant="accent">
          {text.cta}
        </Button>
      </div>
    </Container>
  );
}
