import Link from "next/link";
import { adminLanguages, languageNames } from "./copy";
import { adminOpenForTesting } from "./guard";
import { adminWords } from "./language";

/* The admin pages, and the words for each come from copy.ts. */
const pages = [
  { href: "/admin", key: "payments" },
  { href: "/admin/clients", key: "clients" },
  { href: "/admin/postes", key: "devices" },
  { href: "/admin/codes", key: "codes" },
  { href: "/admin/parcours", key: "funnel" },
  { href: "/admin/essais", key: "trials" },
  { href: "/admin/demandes", key: "requests" },
  { href: "/admin/reglages", key: "settings" },
  { href: "/admin/cout-ia", key: "aiCost" },
] as const;

export async function AdminNav({ current, staff }: { current: string; staff: string }) {
  const { lang, t } = await adminWords();
  /* Switching language comes back to this same page. */
  const here = current;

  return (
    <header className="mb-8 space-y-4">
      {/*
        * Nobody should forget that this admin area is open. It says so on
        * every page it is open on.
        */}
      {adminOpenForTesting() ? (
        <p className="rounded-md border-2 border-foreground px-3 py-2 text-base font-medium text-foreground">
          {t.openBanner}
        </p>
      ) : null}
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <span className="text-base font-medium text-foreground">{t.brand}</span>
        <span className="flex flex-wrap items-baseline gap-4">
          {adminLanguages.map((one) =>
            one === lang ? (
              <span key={one} className="text-base font-medium text-foreground" lang={one}>
                {languageNames[one]}
              </span>
            ) : (
              <a
                key={one}
                lang={one}
                href={`/api/admin/language?lang=${one}&back=${encodeURIComponent(here)}`}
                className="inline-flex min-h-[44px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
              >
                {languageNames[one]}
              </a>
            )
          )}
          <span className="text-base text-muted-foreground">
            {adminOpenForTesting() ? t.openStaff : staff}
          </span>
        </span>
      </div>
      <nav className="flex flex-wrap gap-x-5 gap-y-2">
        {pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className={
              page.href === current
                ? "min-h-[44px] text-base font-medium text-foreground"
                : "min-h-[44px] text-base text-muted-foreground hover:text-foreground"
            }
          >
            {t.nav[page.key]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
