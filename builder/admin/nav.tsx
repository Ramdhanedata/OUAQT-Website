import Link from "next/link";
import { adminOpenForTesting } from "./guard";

/* The pages from the brief, plus the trials list the abuse rules needed. */
const pages = [
  { href: "/admin", label: "Paiements" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/postes", label: "Postes" },
  { href: "/admin/codes", label: "Codes" },
  { href: "/admin/parcours", label: "Parcours" },
  { href: "/admin/essais", label: "Essais" },
  { href: "/admin/demandes", label: "Demandes" },
  { href: "/admin/reglages", label: "Réglages" },
  { href: "/admin/cout-ia", label: "Coût IA" },
];

export function AdminNav({ current, staff }: { current: string; staff: string }) {
  return (
    <header className="mb-8 space-y-4">
      {/*
        * Nobody should forget that this admin area is open. It says so on
        * every page it is open on.
        */}
      {adminOpenForTesting() ? (
        <p className="rounded-md border-2 border-foreground px-3 py-2 text-base font-medium text-foreground">
          Administration de test, ouverte sans connexion. Elle se ferme d&apos;elle-même en
          production et sur toute autre base de données.
        </p>
      ) : null}
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-base font-medium text-foreground">OUAQT admin</span>
        <span className="text-base text-muted-foreground">{staff}</span>
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
            {page.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
