import { Container } from "@/components/ui/container";
import { Logo } from "@/components/logo";
import Link from "next/link";

import { organization, socialLinks } from "@/lib/data/contact";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";

export function Footer({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const nav = [
    { href: "/", label: dict.nav.home },
    { href: "/projects", label: dict.nav.projects },
    { href: "/about", label: dict.nav.about },
    { href: "/contact", label: dict.nav.contact },
  ];

  return (
    <footer className="border-t border-border">
      <Container className="grid grid-cols-1 gap-12 py-16 sm:grid-cols-3">
        <div>
          <Logo className="h-6" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {dict.footer.tagline}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {organization.location}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            {dict.footer.navigate}
          </p>
          <ul className="mt-4 space-y-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={localeHref(lang, item.href)}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
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
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${organization.email}`}
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
      </Container>
    </footer>
  );
}
