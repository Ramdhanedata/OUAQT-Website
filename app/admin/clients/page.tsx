import Link from "next/link";
import { wordFor } from "@/builder/admin/copy";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { LiveRefresh } from "@/builder/admin/live";
import { AdminNav } from "@/builder/admin/nav";
import {
  ago,
  groupOf,
  isStatusGroup,
  latestLicences,
  shopStatus,
  statusGroups,
  type LicenceRow,
  type StatusGroup,
} from "@/builder/admin/overview-math";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { StatusBadge } from "@/builder/admin/status-badge";
import { adminClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";
import { findShops } from "@/builder/admin/search";
import { fill } from "@/lib/utils";

/*
 * Every client, and finding one.
 *
 * By whatever the person on the phone has in front of them: the shop's name,
 * the owner's phone, the numéro de série, the code on the computer's screen
 * or the address. The search box above every admin page brings its words
 * here; builder/admin/search.ts says how each kind is matched.
 *
 * The filters are the licence states, worked out from the dates like
 * everywhere else, so they are counted here rather than asked of the
 * database. Each row opens the shop's own page, where it can be acted on.
 */

const MANY = 5_000; // not-a-rule: a ceiling on each read, far above today's shop count
const SHOWN = 200; // not-a-rule: rows drawn at once; a search narrows the rest

export default async function ClientsPage(props: { searchParams: Promise<{ q?: string; statut?: string }> }) {
  const searchParams = await props.searchParams;
  const gate = await adminGate();
  const { lang, t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const query = (searchParams.q ?? "").trim();
  const filter: StatusGroup | null = isStatusGroup(searchParams.statut) ? searchParams.statut : null;
  const settings = await getPublicSettings();
  const rules = { renewalGraceDays: settings?.renewal_grace_days ?? 0 };

  const [found, { data: licenceRows }, { data: devices }] = await Promise.all([
    findShops(supabase, query),
    supabase
      .from("licences")
      .select("business_id, plan, status, starts_at, ends_at, created_at")
      .order("created_at", { ascending: false })
      .limit(MANY),
    supabase
      .from("devices")
      .select("business_id, last_seen")
      .eq("status", "active")
      .order("last_seen", { ascending: false })
      .limit(MANY),
  ]);

  const now = new Date();
  const licences = latestLicences((licenceRows ?? []) as LicenceRow[]);
  const seen = new Map<string, { last: string; computers: number }>();
  for (const device of devices ?? []) {
    const known = seen.get(device.business_id);
    if (known) known.computers += 1;
    else seen.set(device.business_id, { last: device.last_seen, computers: 1 });
  }

  const rows = found.map(({ shop: business, matched }) => {
    const licence = licences.get(business.id);
    const status = shopStatus(licence, now, rules);
    return { business, matched, licence, status, group: groupOf(status), seen: seen.get(business.id) };
  });

  const counts = Object.fromEntries(statusGroups.map((group) => [group, rows.filter((row) => row.group === group).length]));
  const matching = filter ? rows.filter((row) => row.group === filter) : rows;
  const shown = matching.slice(0, SHOWN);

  /* A filter link keeps the search, and pressing the active filter again clears it. */
  const linkFor = (group: StatusGroup | null) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (group) params.set("statut", group);
    const text = params.toString();
    return text ? `/admin/clients?${text}` : "/admin/clients";
  };

  return (
    <>
      <AdminNav current="/admin/clients" staff={gate.staff.name ?? t.staffFallback} />
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t.clients.title}</h1>
        <LiveRefresh drawnAt={now.toISOString()} words={{ live: t.overview.live, refresh: t.overview.refresh }} locale={locale} />
      </div>

      {query ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {fill(t.clients.searchingFor, { query })}
          <Link href={filter ? `/admin/clients?statut=${filter}` : "/admin/clients"} className="rounded-full border border-border px-3 py-1 text-foreground hover:border-foreground">
            {t.clients.clearSearch}
          </Link>
        </p>
      ) : null}

      <nav className="mt-4 flex flex-wrap gap-2">
        <Chip href={linkFor(null)} active={!filter} label={`${t.clients.all} · ${rows.length}`} />
        {statusGroups.map((group) => (
          <Chip
            key={group}
            href={linkFor(filter === group ? null : group)}
            active={filter === group}
            label={`${t.overview.tiles[group]} · ${counts[group]}`}
          />
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="mt-6 text-base text-muted-foreground">{query || filter ? t.clients.nothingFound : t.clients.none}</p>
      ) : (
        <>
          {matching.length > shown.length ? (
            <p className="mt-4 text-base text-muted-foreground">{fill(t.clients.shown, { shown: shown.length, total: matching.length })}</p>
          ) : null}
          <ul className="mt-4 divide-y divide-border">
            {shown.map(({ business, matched, licence, status, seen: lastSeen }) => (
              <li key={business.id}>
                <Link
                  href={`/admin/clients/${business.id}`}
                  className="-mx-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg px-3 py-3 hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="block text-base font-medium text-foreground">
                      {business.name_latin}
                      {business.name_arabic ? (
                        <span className="font-normal text-muted-foreground">
                          {" · "}
                          <bdi dir="rtl" lang="ar">
                            {business.name_arabic}
                          </bdi>
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {matched && matched !== "name" ? `${fill(t.search.by, { what: t.search.matched[matched] ?? matched })} · ` : ""}
                      {wordFor(t.packs, business.pack)}
                      {business.launch_client ? ` · ${t.clients.launch}` : ""}
                      {" · "}
                      {lastSeen ? fill(t.clients.seen, { ago: ago(lastSeen.last, now, lang) }) : t.clients.neverSeen}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-3">
                    {licence?.ends_at ? (
                      <span className="text-base text-muted-foreground">{new Date(licence.ends_at).toLocaleDateString(locale)}</span>
                    ) : null}
                    <StatusBadge status={status} label={status ? wordFor(t.statuses, status) : t.clients.noLicence} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-base ${
        active ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
