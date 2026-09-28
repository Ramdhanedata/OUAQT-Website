import { Container } from "@/components/ui/container";
import { Logo } from "@/components/logo";
import Link from "next/link";

import { organization, socialLinks } from "@/lib/data/contact";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { getBuilderCopy } from "@/builder/copy";

export function Footer({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  /* The product and what it costs, then the company behind it. */
  const product = [
    { href: localisedHref(lang, "builder"), label: getBuilderCopy(lang).nav },
    { href: localeHref(lang, "/#builder"), label: dict.nav.builder },
    { href: localeHref(lang, "/#metiers"), label: dict.builderHome.tradesEyebrow },
    { href: localeHref(lang, "/pricing"), label: dict.nav.pricing },
  ];
  const company = [
    { href: localeHref(lang, "/#sur-mesure"), label: dict.nav.custom },
    { href: localeHref(lang, "/projects"), label: dict.nav.projects },
    { href: localeHref(lang, "/about"), label: dict.nav.about },
    { href: localeHref(lang, "/contact"), label: dict.nav.contact },
  ];

  const legal = [
    { href: "/terms", label: dict.footer.terms },
    { href: "/privacy", label: dict.footer.privacy },
  ];

  return (
    <footer className="border-t border-border">
      <Container className="grid grid-cols-2 gap-x-8 gap-y-12 py-16 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="col-span-2 lg:col-span-1">
          <Logo className="h-6" alt={dict.common.brand} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {dict.footer.tagline}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {dict.common.headquarters}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">{dict.footer.product}</p>
          <ul className="mt-4 space-y-3">
            {product.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">{dict.footer.company}</p>
          <ul className="mt-4 space-y-3">
            {company.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            {dict.footer.connect}
          </p>
          <ul className="mt-4 space-y-3">
            {socialLinks.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {dict.common[item.key]}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${organization.email}`}
                dir="ltr"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {organization.email}
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col gap-4 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {dict.footer.brand}. {dict.footer.rights}
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {legal.map((item) => (
            <li key={item.href}>
              <Link
                href={localeHref(lang, item.href)}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </footer>
  );
}
