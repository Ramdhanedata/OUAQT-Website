"use client";

import { useState } from "react";
import { packs, type Pack } from "@/app-ui/packs";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { Notify } from "@/components/packs/notify";

/*
 * The four trades, and the honest state of each.
 *
 * Which ones are open comes from settings, never from this file. A trade that
 * is not open yet takes a phone number instead of pretending: the number goes
 * to the same place the builder's own "my business is not on this list" goes,
 * through a server route, because that table is closed to browsers.
 */
export function Trades({
  dict,
  lang,
  enabledPacks,
  packHrefs,
  packPages,
}: {
  dict: Dictionary;
  lang: Locale;
  enabledPacks: Pack[];
  packHrefs: Record<Pack, string>;
  packPages: Record<Pack, string>;
}) {
  const home = dict.builderHome;
  const [asking, setAsking] = useState<Pack | "other" | null>(null);

  const label: Record<Pack, string> = {
    pharmacy: dict.packLabels.pharmacy,
    bakery: dict.packLabels.bakery,
    restaurant: dict.packLabels.restaurant,
    warehouse: dict.packLabels.warehouse,
    shop: dict.packLabels.shop,
    hotel: dict.packLabels.hotel,
    transport: dict.packLabels.transport,
    general: dict.packLabels.general,
  };

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {home.tradesHeading}
        </h2>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {packs.map((pack) => {
            const open = enabledPacks.includes(pack);
            return (
              <li key={pack} className="flex flex-col">
                {open ? (
                  <a
                    href={packHrefs[pack]}
                    className="flex min-h-[96px] flex-col justify-center rounded-2xl border border-border p-6 transition-colors hover:border-foreground/40"
                  >
                    <span className="text-xl font-medium text-foreground">
                      {label[pack]}
                    </span>
                    <span className="mt-1 text-base text-muted-foreground">
                      {home.tradesOpen}
                    </span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAsking(asking === pack ? null : pack)}
                    className="flex min-h-[96px] w-full flex-col justify-center rounded-2xl border border-border p-6 text-start transition-colors hover:border-foreground/40"
                  >
                    <span className="text-xl font-medium text-foreground">
                      {label[pack]}
                    </span>
                    <span className="mt-1 text-base text-muted-foreground">
                      {home.tradesSoon}
                    </span>
                  </button>
                )}
                <a
                  href={packPages[pack]}
                  className="mt-2 inline-flex min-h-[44px] items-center px-1 text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                >
                  {home.tradesLearnMore}
                </a>
              </li>
            );
          })}
        </ul>

        {asking && asking !== "other" ? (
          <Notify dict={dict} businessType={label[asking]} />
        ) : null}

        <div className="mt-8">
          <a
            href={localeHref(lang, "/contact")}
            className="inline-flex min-h-[48px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            {home.tradesOther}
          </a>
        </div>

        <p className="sr-only">
          <a href={localisedHref(lang, "builder")}>{home.heroPrimary}</a>
        </p>
      </Container>
    </section>
  );
}
