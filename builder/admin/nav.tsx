import Link from "next/link";

/* The eight pages from the brief, all of them now with something behind them. */
const pages = [
  { href: "/admin", label: "Paiements" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/postes", label: "Postes" },
  { href: "/admin/codes", label: "Codes" },
  { href: "/admin/parcours", label: "Parcours" },
  { href: "/admin/demandes", label: "Demandes" },
  { href: "/admin/reglages", label: "Réglages" },
  { href: "/admin/cout-ia", label: "Coût IA" },
];

export function AdminNav({ current, staff }: { current: string; staff: string }) {
  return (
    <header className="mb-8 space-y-4">
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
