import { ChartColumn, CreditCard, Handshake, Inbox, LayoutDashboard, Monitor, Settings, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { adminClient } from "@/builder/db/server";
import { adminLanguages, languageNames } from "./copy";
import { GlobalSearch } from "./global-search";
import { adminOpenForTesting } from "./guard";
import { adminWords } from "./language";
import { SignOut } from "./sign-out";

/*
 * The admin menu, and the search box above every page.
 *
 * Eight entries, so the whole menu shows on any screen without scrolling:
 * fifteen did not, and the last three, the team, the representatives and the
 * AI cost, sat below the fold where nobody found them. Pages that belong
 * together share one entry and show as tabs under the search box: the trials
 * and the renewal codes with the clients, the test devices with the devices,
 * the builder's steps and the AI cost with the statistics, the team with the
 * settings. Every address is the one it always was.
 *
 * On a wide screen the menu is a fixed column. On a phone it is one row that
 * scrolls sideways. Every item has its words beside its icon, and the two
 * that collect work for staff, payments and requests, carry how much waits.
 */

type Key =
  | "overview"
  | "stats"
  | "reps"
  | "clients"
  | "payments"
  | "devices"
  | "trials"
  | "testers"
  | "requests"
  | "funnel"
  | "codes"
  | "settings"
  | "staff"
  | "aiCost";

type Item = { href: string; key: Key; icon: LucideIcon };
type Tab = { href: string; key: Key };

/* The work of every day first; under the line, the figures and the setup. */
const menu: Item[][] = [
  [
    { href: "/admin", key: "overview", icon: LayoutDashboard },
    { href: "/admin/clients", key: "clients", icon: Users },
    { href: "/admin/paiements", key: "payments", icon: CreditCard },
    { href: "/admin/postes", key: "devices", icon: Monitor },
    { href: "/admin/commerciaux", key: "reps", icon: Handshake },
    { href: "/admin/demandes", key: "requests", icon: Inbox },
  ],
  [
    { href: "/admin/statistiques", key: "stats", icon: ChartColumn },
    { href: "/admin/reglages", key: "settings", icon: Settings },
  ],
];

/* The pages behind one menu entry, in the order of their tabs. The first is the entry itself. */
const tabsOf: Partial<Record<Key, Tab[]>> = {
  clients: [
    { href: "/admin/clients", key: "clients" },
    { href: "/admin/essais", key: "trials" },
    { href: "/admin/codes", key: "codes" },
  ],
  devices: [
    { href: "/admin/postes", key: "devices" },
    { href: "/admin/appareils-test", key: "testers" },
  ],
  stats: [
    { href: "/admin/statistiques", key: "stats" },
    { href: "/admin/parcours", key: "funnel" },
    { href: "/admin/cout-ia", key: "aiCost" },
  ],
  settings: [
    { href: "/admin/reglages", key: "settings" },
    { href: "/admin/equipe", key: "staff" },
  ],
};

/* The menu entry a page lights: its own, or the one whose tabs hold it. */
export function entryFor(current: string): string {
  for (const item of menu.flat()) {
    if (item.href === current || tabsOf[item.key]?.some((tab) => tab.href === current)) return item.href;
  }
  return current;
}

/* What waits for a person, counted for the menu. Cheap: four counts, no rows. */
async function waiting(): Promise<Partial<Record<Key, number>>> {
  const supabase = adminClient();
  if (!supabase) return {};
  const count = { count: "exact" as const, head: true };
  const [payments, review, codes, requests] = await Promise.all([
    supabase.from("payments").select("id", count).in("status", ["submitted", "pending_confirmation"]),
    supabase.from("payments").select("id", count).eq("status", "confirmed").eq("auto_confirmed", true).is("reviewed_at", null),
    supabase.from("configuration_code_requests").select("id", count).is("handled_at", null).eq("sent", false),
    supabase.from("feature_requests").select("id", count).eq("status", "new"),
  ]);
  return {
    payments: (payments.count ?? 0) + (review.count ?? 0),
    requests: (codes.count ?? 0) + (requests.count ?? 0),
  };
}

/*
 * `current` is the page's own address in the menu or among the tabs; `here`,
 * when given, is the exact page a language switch comes back to.
 */
export async function AdminNav({ current, staff, here }: { current: string; staff: string; here?: string }) {
  const { lang, t } = await adminWords();
  const counts = await waiting();
  const open = adminOpenForTesting();
  const lit = entryFor(current);
  const entry = menu.flat().find((item) => item.href === lit);
  /* A page inside an entry, one client or one representative, is past the tabs: it has its own way back. */
  const deeper = Boolean(here) && here!.split("?")[0] !== current;
  const tabs = (entry && !deeper && tabsOf[entry.key]) || [];

  const languages = (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {adminLanguages.map((one) =>
        one === lang ? (
          <span key={one} lang={one} className="text-sm font-medium text-foreground">
            {languageNames[one]}
          </span>
        ) : (
          <a
            key={one}
            lang={one}
            href={`/api/admin/language?lang=${one}&back=${encodeURIComponent(here ?? current)}`}
            className="inline-flex min-h-[32px] items-center text-sm text-muted-foreground hover:text-foreground"
          >
            {languageNames[one]}
          </a>
        )
      )}
    </span>
  );

  const badge = (key: Key) =>
    counts[key] ? (
      <span className="ms-auto rounded-full bg-app-warning-soft px-2 py-0.5 text-xs font-semibold tabular-nums text-app-warning">
        {counts[key]}
      </span>
    ) : null;

  /* Nobody is signed in on an admin area open for testing, so there is nothing to sign out of. */
  const signOut = open ? null : <SignOut label={t.signIn.signOut} />;

  return (
    <>
      <aside className="admin-sidebar fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-border bg-surface lg:flex">
        <Link href="/admin" className="flex items-baseline gap-2 px-6 pb-4 pt-6">
          <span className="text-lg font-semibold tracking-tight text-foreground">OUAQT</span>
          <span className="text-sm text-muted-foreground">admin</span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {menu.map((group, index) => (
            <ul key={index} className={`space-y-0.5 ${index > 0 ? "mt-4 border-t border-border pt-4" : ""}`}>
              {group.map((item) => {
                const on = item.href === lit;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={on ? "page" : undefined}
                      className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-[15px] ${
                        on ? "bg-foreground/[0.06] font-medium text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                      }`}
                    >
                      <Icon aria-hidden className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t.nav[item.key]}</span>
                      {badge(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ))}
        </nav>
        <div className="space-y-2 border-t border-border px-6 py-4">
          {languages}
          <div className="-me-2 flex items-center justify-between gap-2">
            <p className="truncate text-sm text-muted-foreground">{open ? t.openStaff : staff}</p>
            {signOut}
          </div>
        </div>
      </aside>

      <div className="mb-8 space-y-4">
        {/* Nobody should forget that this admin area is open. It says so on every page it is open on. */}
        {open ? (
          <p className="rounded-lg border border-app-warning bg-app-warning-soft px-3 py-2 text-sm text-foreground">{t.openBanner}</p>
        ) : null}

        <div className="space-y-3 lg:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin" className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight text-foreground">OUAQT</span>
              <span className="text-sm text-muted-foreground">admin</span>
            </Link>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {languages}
              {signOut}
            </span>
          </div>
          <nav className="-mx-4 overflow-x-auto px-4">
            <ul className="flex w-max gap-1">
              {menu.flat().map((item) => {
                const on = item.href === lit;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={on ? "page" : undefined}
                      className={`flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm ${
                        on ? "bg-foreground text-background" : "border border-border text-foreground"
                      }`}
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                      {t.nav[item.key]}
                      {counts[item.key] ? <span className="font-semibold tabular-nums">· {counts[item.key]}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <GlobalSearch words={{ t: t.search, packs: t.packs, statuses: t.statuses, noLicence: t.overview.noLicence }} />

        {/* The pages that share this menu entry. */}
        {tabs.length > 1 ? (
          <nav aria-label={entry ? t.nav[entry.key] : undefined} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex w-max gap-1 border-b border-border sm:w-auto">
              {tabs.map((tab) => {
                const on = tab.href === current;
                return (
                  <li key={tab.href}>
                    <Link
                      href={tab.href}
                      aria-current={on ? "page" : undefined}
                      className={`-mb-px inline-flex min-h-[44px] items-center whitespace-nowrap border-b-2 px-4 text-sm ${
                        on ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.nav[tab.key]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </div>
    </>
  );
}
