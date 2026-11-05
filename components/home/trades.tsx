"use client";

import { useState } from "react";
import { packs, type Pack } from "@/app-ui/packs";
import { FadeIn } from "@/components/motion/fade-in";
import { Container } from "@/components/ui/container";
import { Notify } from "@/components/packs/notify";
import type { Dictionary } from "@/lib/i18n";
import { ArrowRight, Plus } from "lucide-react";
import { packIcons } from "@/components/packs/pack-icons";

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
          <p className="eyebrow">{home.tradesEyebrow}</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {home.tradesHeading}
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">{home.tradesBody}</p>
        </FadeIn>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((pack) => {
            const open = enabledPacks.includes(pack);
            const Icon = packIcons[pack];
            return (
              <li
                key={pack}
                className="flex flex-col rounded-3xl border border-border bg-surface p-6 transition-shadow duration-300 hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  {open ? null : (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{home.tradesSoon}</span>
                  )}
                </div>
                <div className="mt-5 min-w-0 flex-1">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">{dict.packLabels[pack]}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{home.tradeLines[pack]}</p>
                </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 border-t border-border pt-2">
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
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-col gap-2 rounded-3xl border border-dashed border-foreground/20 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="text-base leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{home.tradesOther}</span>
            {" · "}
            {home.tradesOtherBody}
          </p>
          <button
            type="button"
            onClick={() => setAsking(asking === "other" ? null : "other")}
            aria-expanded={asking === "other"}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 text-base font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            <Plus className="h-4 w-4" />
            {home.tradesOtherCta}
          </button>
        </div>

        {asking === "other" ? <Notify dict={dict} askBusiness /> : null}
        {asking && asking !== "other" ? <Notify dict={dict} businessType={dict.packLabels[asking]} /> : null}
      </Container>
    </section>
  );
}
