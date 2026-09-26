"use client";

import { useState } from "react";
import { packs, type Pack } from "@/app-ui/packs";
import { FadeIn } from "@/components/motion/fade-in";
import { Container } from "@/components/ui/container";
import { Notify } from "@/components/packs/notify";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowRight, Plus } from "lucide-react";
import { packIcons } from "./pack-icons";

/*
 * The trades, and the honest state of each.
 *
 * Which ones are open comes from settings, never from this file. A trade
 * that is not open yet takes a phone number instead of pretending, and a
 * business that is on no list says what it does and leaves a number: both
 * go to OUAQT's inbox through the same route as the builder's own "my
 * business is not on this list".
 */
export function Trades({
  dict,
  enabledPacks,
  packHrefs,
  packPages,
}: {
  dict: Pick<Dictionary, "builderHome" | "packLabels">;
  enabledPacks: Pack[];
  packHrefs: Record<Pack, string>;
  packPages: Record<Pack, string>;
}) {
  const home = dict.builderHome;
  const [asking, setAsking] = useState<Pack | "other" | null>(null);
  const ordered = [...packs].sort((a, b) => Number(enabledPacks.includes(b)) - Number(enabledPacks.includes(a)));

  return (
    <section id="metiers" className="scroll-mt-20 border-t border-border py-20 sm:py-28">
      <Container>
        <FadeIn className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.tradesEyebrow}</p>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {home.tradesHeading}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{home.tradesBody}</p>
        </FadeIn>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((pack) => {
            const open = enabledPacks.includes(pack);
            const Icon = packIcons[pack];
            return (
              <li key={pack}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-foreground/30">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-app-gold-ink">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        open ? "bg-app-success-soft text-app-success" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {open ? home.tradesOpen : home.tradesSoon}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-foreground">{dict.packLabels[pack]}</h3>
                  <p className="mt-2 flex-1 text-base leading-relaxed text-muted-foreground">{home.tradeLines[pack]}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {open ? (
                      <a
                        href={packHrefs[pack]}
                        className="inline-flex min-h-[44px] items-center gap-1.5 text-base font-medium text-foreground transition-colors hover:text-app-gold-ink"
                      >
                        {home.tradesStart}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAsking(asking === pack ? null : pack)}
                        aria-expanded={asking === pack}
                        className="inline-flex min-h-[44px] items-center text-base font-medium text-foreground transition-colors hover:text-app-gold-ink"
                      >
                        {home.tradesNotifyMe}
                      </button>
                    )}
                    <a
                      href={packPages[pack]}
                      className="inline-flex min-h-[44px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                    >
                      {home.tradesLearnMore}
                    </a>
                  </div>
                </div>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => setAsking(asking === "other" ? null : "other")}
              aria-expanded={asking === "other"}
              className={cn(
                "flex h-full w-full flex-col items-start rounded-2xl border-2 border-dashed p-6 text-start transition-colors",
                asking === "other" ? "border-accent bg-accent/5" : "border-border hover:border-foreground/40"
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground">
                <Plus className="h-5 w-5" />
              </span>
              <span className="mt-5 text-lg font-medium text-foreground">{home.tradesOther}</span>
              <span className="mt-2 text-base leading-relaxed text-muted-foreground">{home.tradesOtherBody}</span>
            </button>
          </li>
        </ul>

        {asking === "other" ? <Notify dict={dict} askBusiness /> : null}
        {asking && asking !== "other" ? <Notify dict={dict} businessType={dict.packLabels[asking]} /> : null}
      </Container>
    </section>
  );
}
