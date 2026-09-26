"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { getBuilderCopy } from "@/builder/copy";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

/* Only the groups it reads: a client component's props travel to every page. */
export function Navbar({ dict, lang }: { dict: Pick<Dictionary, "nav" | "common">; lang: Locale }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  /* Building the software is the action button, beside the links. */
  const builder = {
    href: localisedHref(lang, "builder"),
    label: getBuilderCopy(lang).nav,
  };

  /*
   * The product first, the custom work second, then the company.
   *
   * Pricing left the menu: it is a question an owner asks once he has seen
   * the product, so it sits in the Builder's section, in its own block on
   * the home page and in the footer. "Accueil" is not here either: the logo
   * goes home. Five short labels fit the header at 1024px in French.
   */
  const links = [
    { href: "/#builder", label: dict.nav.builder },
    { href: "/#sur-mesure", label: dict.nav.custom },
    { href: "/projects", label: dict.nav.projects },
    { href: "/about", label: dict.nav.about },
    { href: "/contact", label: dict.nav.contact },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <Link
          href={localeHref(lang, "/")}
          aria-label={dict.nav.homeAria}
          className="shrink-0"
        >
          <Logo priority className="h-6 sm:h-7" alt={dict.common.brand} />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={localeHref(lang, link.href)}
              className={cn(
                "whitespace-nowrap text-sm font-medium tracking-tight transition-colors",
                pathname === localeHref(lang, link.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher locale={lang} label={dict.nav.language} />
          <Button
            href={builder.href}
            variant="accent"
            className="whitespace-nowrap text-sm"
          >
            {builder.label}
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher locale={lang} label={dict.nav.language} />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center text-foreground"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {menuOpen && (
        <MobileMenu>
            <Container className="flex flex-col gap-1 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={localeHref(lang, link.href)}
                  className={cn(
                    "rounded-lg px-3 py-3 text-sm font-medium tracking-tight transition-colors",
                    pathname === localeHref(lang, link.href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 px-3">
                <Button
                  href={builder.href}
                  variant="accent"
                  className="w-full justify-center text-sm"
                >
                  {builder.label}
                </Button>
              </div>
          </Container>
        </MobileMenu>
      )}
    </header>
  );
}

/*
 * Slides the mobile menu open. It mounts closed and opens right after the
 * first paint, so the CSS transition has something to move from.
 *
 * The effect deliberately does not wait for an animation frame: browsers stop
 * handing those out to tabs they are not drawing, which left the menu stuck
 * shut. An effect always runs, so the menu is open either way.
 */
function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <nav
      data-open={open ? "true" : undefined}
      className="menu-panel border-b border-border bg-background lg:hidden"
    >
      {children}
    </nav>
  );
}
