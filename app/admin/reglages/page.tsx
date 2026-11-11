import type { ReactNode } from "react";
import { panelCopy } from "@/builder/admin/copy-panel";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { AdminNav } from "@/builder/admin/nav";
import { DownloadLinks, SettingField, type TradeLink } from "@/builder/admin/settings-form";
import {
  byPlace,
  installerOf,
  PRICE_ROWS,
  PRICE_TIERS,
  priceCell,
  SETTING_GROUPS,
  shapeOf,
  type SettingGroup,
  type SettingShape,
} from "@/builder/admin/settings-model";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";

/*
 * Every value the system runs on, set from one page.
 *
 * This page is the reason no price is written into the code. Changing what a
 * licence costs should be somebody typing a number here, not a deploy.
 *
 * The values are in groups, each under its own name: the prices as a table
 * in ouguiyas, the trial, the payments, the licence, the downloads, the
 * launch offer, the AI, the contact. A setting that has no name yet lands in
 * the last group, typed as it is stored, so nothing in the table is ever out
 * of reach. The overview links straight to a group (#prices, #trial…).
 */

type Row = { key: string; value: unknown; description: string | null; shape: SettingShape };

export default async function SettingsPage() {
  const gate = await adminGate();
  const { t, lang } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const { data: settings } = await supabase.from("settings").select("key, value, description").order("key");

  const w = panelCopy[lang].settings;
  const rows: Row[] = (settings ?? []).map((one) => ({
    key: one.key as string,
    value: one.value as unknown,
    description: (one.description as string | null) ?? null,
    shape: shapeOf(one.key as string, one.value),
  }));
  const inGroup = (group: SettingGroup) => rows.filter((row) => row.shape.group === group).sort((a, b) => byPlace(a.key, b.key));
  const byKey = new Map(rows.map((row) => [row.key, row]));

  /* A named setting says its name and what it does; an unnamed one shows its key and the note kept with it. */
  const field = (row: Row, options: { bare?: boolean; label?: string } = {}) => (
    <SettingField
      key={row.key}
      settingKey={row.key}
      shape={row.shape}
      stored={row.value}
      label={options.label ?? w.labels[row.key] ?? row.key}
      hint={w.hints[row.key] ?? (w.labels[row.key] ? null : row.description)}
      words={w}
      bare={options.bare}
    />
  );

  const prices = inGroup("prices");
  const priced = prices.filter((row) => priceCell(row.key));
  const pricedAlone = prices.filter((row) => !priceCell(row.key));
  const priceRows = PRICE_ROWS.filter((name) => priced.some((row) => priceCell(row.key)?.row === name));

  const downloads = inGroup("downloads");
  const linksFor = (platform: "windows" | "mac"): TradeLink[] =>
    downloads
      .filter((row) => installerOf(row.key)?.platform === platform)
      .map((row) => ({ key: row.key, trade: t.packs[installerOf(row.key)!.pack] ?? installerOf(row.key)!.pack, value: typeof row.value === "string" ? row.value : "" }));
  const videos = downloads.filter((row) => !installerOf(row.key));

  const groups = SETTING_GROUPS.filter((group) => inGroup(group).length > 0);

  return (
    <>
      <AdminNav current="/admin/reglages" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.settings.title}</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">{w.intro}</p>

      {/* Straight to a group, on a page that is long by nature. */}
      <nav aria-label={t.settings.title} className="mt-6 flex flex-wrap gap-2">
        {groups.map((group) => (
          <a
            key={group}
            href={`#${group}`}
            className="inline-flex min-h-[40px] items-center rounded-full border border-border px-4 text-sm text-foreground hover:border-foreground/40"
          >
            {w.groups[group].title}
          </a>
        ))}
      </nav>

      {groups.map((group) => (
        <Group key={group} id={group} title={w.groups[group].title} intro={w.groups[group].intro}>
          {group === "prices" ? (
            <>
              <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
                <table className="w-full min-w-[560px] border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-sm text-muted-foreground">
                      <th scope="col" className="w-2/5" />
                      {PRICE_TIERS.map((tier) => (
                        <th key={tier} scope="col" className="pb-1 text-start font-medium">
                          {w.tiers[tier]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {priceRows.map((name) => (
                      <tr key={name}>
                        <th scope="row" className="pe-4 text-start align-top text-[15px] font-medium leading-[44px] text-foreground">
                          {w.priceRows[name] ?? name}
                        </th>
                        {PRICE_TIERS.map((tier) => {
                          const row = byKey.get(`price_${name}_${tier}_mru`);
                          return (
                            <td key={tier} className="pe-4 align-top">
                              {row ? field(row, { bare: true, label: `${w.priceRows[name] ?? name} · ${w.tiers[tier]}` }) : null}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pricedAlone.length ? <div className="mt-6 grid gap-x-8 gap-y-6 border-t border-border pt-6 sm:grid-cols-2">{pricedAlone.map((row) => field(row))}</div> : null}
            </>
          ) : group === "downloads" ? (
            <div className="space-y-8">
              {linksFor("windows").length ? <DownloadLinks platform="windows" title={w.links.windows} links={linksFor("windows")} words={w} /> : null}
              {linksFor("mac").length ? <DownloadLinks platform="mac" title={w.links.mac} note={w.links.macNote} links={linksFor("mac")} words={w} /> : null}
              {videos.length ? <div className="grid gap-x-8 gap-y-6 border-t border-border pt-6 sm:grid-cols-2">{videos.map((row) => field(row))}</div> : null}
            </div>
          ) : (
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">{inGroup(group).map((row) => field(row))}</div>
          )}
        </Group>
      ))}

      {/*
        * The way into trades that are not open to owners yet (which ones:
        * builder/packs/opening.ts). This link lets this browser choose them
        * in the builder for thirty days.
        */}
      <Group id="tools" title={w.toolsTitle} intro={t.settings.testPacks}>
        <div className="flex flex-wrap items-center gap-4">
          {/* A request that sets a cookie and redirects, not a page: a full navigation on purpose. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/admin/test-builder"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:border-foreground/40"
          >
            {t.settings.testBuilder}
          </a>
          {/* A request that sets a cookie and redirects, not a page: a full navigation on purpose. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/admin/test-builder?off=1" className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground underline">
            {t.settings.leaveTest}
          </a>
        </div>
      </Group>
    </>
  );
}

/* scroll-mt: a link from the overview lands with the group's title in view, not under the top of the window. */
function Group({ id, title, intro, children }: { id: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-4 scroll-mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{intro}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
