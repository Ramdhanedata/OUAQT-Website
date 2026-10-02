import {
  ChartColumn,
  CreditCard,
  FlaskConical,
  Handshake,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Monitor,
  Route,
  Settings,
  Sparkles,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { adminClient } from "@/builder/db/server";
import { adminLanguages, languageNames } from "./copy";
import { GlobalSearch } from "./global-search";
import { adminOpenForTesting } from "./guard";
import { adminWords } from "./language";

/*
 * The admin menu, and the search box above every page.
 *
 * On a wide screen the menu is a fixed column, in three groups: the pages
 * used every day, the follow-up, and the setup. On a phone it is one row that
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
  | "requests"
  | "funnel"
  | "codes"
  | "settings"
  | "staff"
  | "aiCost";

type Item = { href: string; key: Key; icon: LucideIcon };

const groups: { title: "follow" | "setup" | null; items: Item[] }[] = [
  {
    title: null,
    items: [
      { href: "/admin", key: "overview", icon: LayoutDashboard },
      { href: "/admin/statistiques", key: "stats", icon: ChartColumn },
      { href: "/admin/clients", key: "clients", icon: Users },
      { href: "/admin/paiements", key: "payments", icon: CreditCard },
      { href: "/admin/postes", key: "devices", icon: Monitor },
    ],
  },
  {
    title: "follow",
    items: [
      { href: "/admin/essais", key: "trials", icon: FlaskConical },
      { href: "/admin/demandes", key: "requests", icon: Inbox },
      { href: "/admin/parcours", key: "funnel", icon: Route },
    ],
  },
  {
    title: "setup",
    items: [
      { href: "/admin/codes", key: "codes", icon: KeyRound },
      { href: "/admin/reglages", key: "settings", icon: Settings },
      { href: "/admin/equipe", key: "staff", icon: UserCog },
      { href: "/admin/commerciaux", key: "reps", icon: Handshake },
      { href: "/admin/cout-ia", key: "aiCost", icon: Sparkles },
    ],
  },
];

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

/* `current` is the menu item lit; `here`, when given, is the exact page a language switch comes back to. */
export async function AdminNav({ current, staff, here }: { current: string; staff: string; here?: string }) {
  const { lang, t } = await adminWords();
  const counts = await waiting();
  const open = adminOpenForTesting();

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

  return (
    <>
      <aside className="admin-sidebar fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-border bg-surface lg:flex">
        <Link href="/admin" className="flex items-baseline gap-2 px-6 pb-4 pt-6">
          <span className="text-lg font-semibold tracking-tight text-foreground">OUAQT</span>
          <span className="text-sm text-muted-foreground">admin</span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group, index) => (
            <div key={index} className={index > 0 ? "mt-6" : ""}>
              {group.title ? (
                <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.navGroups[group.title]}</p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const here = item.href === current;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={here ? "page" : undefined}
                        className={`flex min-h-[40px] items-center gap-3 rounded-lg px-3 text-[15px] ${
                          here ? "bg-foreground/[0.06] font-medium text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
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
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-border px-6 py-4">
          {languages}
          <p className="truncate text-sm text-muted-foreground">{open ? t.openStaff : staff}</p>
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
            {languages}
          </div>
          <nav className="-mx-4 overflow-x-auto px-4">
            <ul className="flex w-max gap-1">
              {groups.flatMap((group) => group.items).map((item) => {
                const here = item.href === current;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={here ? "page" : undefined}
                      className={`flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm ${
                        here ? "bg-foreground text-background" : "border border-border text-foreground"
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
      </div>
    </>
  );
}
