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
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.tradesEyebrow}</p>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {home.tradesHeading}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{home.tradesBody}</p>
        </FadeIn>

        <ul className="mt-12 grid gap-x-10 sm:grid-cols-2">
          {ordered.map((pack) => {
            const open = enabledPacks.includes(pack);
            const Icon = packIcons[pack];
            return (
              <li key={pack} className="flex gap-4 border-t border-border py-6">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-app-gold-ink" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium text-foreground">
                    {dict.packLabels[pack]}
                    {open ? null : <span className="ms-2 text-sm font-normal text-muted-foreground">· {home.tradesSoon}</span>}
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">{home.tradeLines[pack]}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5">
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
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-baseline sm:gap-4">
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
