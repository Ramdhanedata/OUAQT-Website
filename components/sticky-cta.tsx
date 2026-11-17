"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

/*
 * On a phone, the way into the builder stays one thumb away.
 *
 * The home page and each trade's page are long, and their own buttons are a
 * good scroll apart. This bar carries the same button between them. It
 * steps aside whenever one of the page's own ways in is on screen (anything
 * marked data-hides-sticky-cta), so there is never more than one button
 * saying the same thing, and at the footer, which it would otherwise cover.
 */
export function StickyCta({ href, label }: { href: string; label: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const marks = Array.from(document.querySelectorAll("[data-hides-sticky-cta]"));
    if (marks.length === 0 || !("IntersectionObserver" in window)) return;
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setShow(onScreen.size === 0);
    });
    for (const mark of marks) observer.observe(mark);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur transition-transform duration-300 lg:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full"
      )}
    >
      <Container className="pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <Button href={href} variant="accent" tabIndex={show ? 0 : -1} className="min-h-[52px] w-full text-base font-semibold">
          {label}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Button>
      </Container>
    </div>
  );
}
