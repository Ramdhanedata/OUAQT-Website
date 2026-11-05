"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BarChart3, Monitor, Package, Pause, Play, RefreshCw, ShoppingCart, Smartphone, Wallet, WifiOff } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Container } from "@/components/ui/container";
import { Laptop, Phone } from "@/components/home/devices";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/*
 * How the software works, on both screens at once: a grocery's day in four
 * steps, each a real screen of the app on a computer and on a phone
 * (scripts/product-shots.mjs takes them, in each language).
 *
 * The steps move on by themselves while the section is on screen, so a
 * visitor who only scrolls still sees the day go by. A click on a step, or
 * the pause button, stops that for good; someone who asked the system for
 * less motion never sees it move.
 *
 * Under it, what having two devices means: what one enters the other sees,
 * each works offline, and the phone needs no app store. Each line is what
 * the software does today (the FAQ says the same).
 */

const SHOTS = ["sell", "stock", "day", "reports"] as const;
const ICONS = [ShoppingCart, Package, Wallet, BarChart3];
const STEP_MS = 6000;

/* Only the words it shows: a client component's props travel with the page. */
export type TourCopy = Pick<
  Dictionary["builderHome"],
  "tourEyebrow" | "tourHeading" | "tourBody" | "tourSteps" | "tourPause" | "tourPlay" | "tourTogetherHeading" | "tourTogether"
>;

export function DeviceTour({ home, lang }: { home: TourCopy; lang: Locale }) {
  const steps = home.tourSteps;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    const element = box.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => setVisible(entries.some((entry) => entry.isIntersecting)), { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const moving = playing && visible && !hovered;

  useEffect(() => {
    if (!moving) return;
    const timer = setTimeout(() => setActive((current) => (current + 1) % steps.length), STEP_MS);
    return () => clearTimeout(timer);
  }, [moving, active, steps.length]);

  const choose = (index: number) => {
    setActive(index);
    setPlaying(false);
  };

  const together = [RefreshCw, WifiOff, Smartphone];

  return (
    <section id="how" className="scroll-mt-20 py-20 sm:py-28">
      <Container>
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{home.tourEyebrow}</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{home.tourHeading}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">{home.tourBody}</p>
        </FadeIn>

        <div
          ref={box}
          className="mt-14 grid items-center gap-10 lg:mt-16 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.5fr)] lg:gap-14"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* The stage: the same step on both devices, the pictures crossfading from one step to the next. */}
          <div className="relative lg:order-2">
            <div aria-hidden className="glow-gold absolute inset-x-[-10%] top-[5%] -z-10 h-[90%]" />
            {/* The phone on the corner of the app's menu, as in the hero, so it hides no figure. */}
            <div className="relative pb-[5%] ps-[10%]">
              <Laptop screenClassName="aspect-[16/10]">
                {SHOTS.map((shot, index) => (
                  <Image
                    key={shot}
                    src={`/images/product/${shot}-computer-${lang}.webp`}
                    alt={steps[index].computerAlt}
                    width={1600}
                    height={1000}
                    sizes="(min-width: 1024px) 640px, 90vw"
                    aria-hidden={index !== active}
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                      index === active ? "opacity-100" : "opacity-0"
                    )}
                  />
                ))}
              </Laptop>
              <Phone className="absolute bottom-0 start-0 w-[31%] sm:w-[27%]">
                <div className="relative aspect-[390/844]">
                  {SHOTS.map((shot, index) => (
                    <Image
                      key={shot}
                      src={`/images/product/${shot}-phone-${lang}.webp`}
                      alt={steps[index].phoneAlt}
                      width={780}
                      height={1688}
                      sizes="(min-width: 1024px) 190px, 28vw"
                      aria-hidden={index !== active}
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                        index === active ? "opacity-100" : "opacity-0"
                      )}
                    />
                  ))}
                </div>
              </Phone>
            </div>
          </div>

          {/* The steps. The one shown is open, with a bar that fills until the next. */}
          <div className="lg:order-1">
            <ol className="space-y-2">
              {steps.map((step, index) => {
                const Icon = ICONS[index];
                const open = index === active;
                return (
                  <li key={step.title}>
                    <button
                      type="button"
                      onClick={() => choose(index)}
                      aria-current={open ? "step" : undefined}
                      className={cn(
                        "group relative w-full overflow-hidden rounded-2xl border p-5 text-start transition-all duration-300",
                        open ? "border-border bg-surface shadow-card" : "border-transparent hover:bg-surface/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                            open ? "bg-foreground text-background" : "bg-muted text-foreground"
                          )}
                        >
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-foreground">{step.title}</span>
                      </span>
                      <span
                        className={cn(
                          "grid transition-[grid-template-rows,opacity] duration-300",
                          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        )}
                      >
                        <span className="overflow-hidden">
                          <span className="block pt-3 text-base leading-relaxed text-muted-foreground">{step.body}</span>
                        </span>
                      </span>
                      {open && playing ? (
                        <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
                          <span
                            key={active}
                            className="tour-progress block h-full bg-app-gold-ink"
                            data-paused={moving ? undefined : "true"}
                            style={{ "--tour-ms": `${STEP_MS}ms` } as CSSProperties}
                          />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>

            <button
              type="button"
              onClick={() => setPlaying((before) => !before)}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 rtl:rotate-180" />}
              {playing ? home.tourPause : home.tourPlay}
            </button>
          </div>
        </div>

        {/* Two devices, one business. */}
        <FadeIn className="mt-20 overflow-hidden rounded-3xl bg-foreground text-background sm:mt-24">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:items-center lg:gap-14">
            <div>
              <h3 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{home.tourTogetherHeading}</h3>
              {/* A computer and a phone, and what one saves travelling to the other. */}
              <div aria-hidden className="mt-8 flex items-center gap-4" dir="ltr">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Monitor className="h-5 w-5" />
                </span>
                <span className="relative h-px flex-1 bg-white/20">
                  <span className="travel-dot absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_rgba(201,169,97,0.9)]" />
                  <span className="travel-dot-back absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/70" />
                </span>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Smartphone className="h-5 w-5" />
                </span>
              </div>
            </div>
            <ul className="grid gap-8 sm:grid-cols-3 sm:gap-6">
              {home.tourTogether.map((item, index) => {
                const Icon = together[index] ?? RefreshCw;
                return (
                  <li key={item.title}>
                    <Icon className="h-5 w-5 text-accent" />
                    <p className="mt-3 text-base font-semibold text-background">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-background/65">{item.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
