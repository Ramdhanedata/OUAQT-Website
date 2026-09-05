import { Container } from "@/components/ui/container";
import Link from "next/link";

import { founder } from "@/lib/data/founder";

const nav = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Systems" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// TODO(adel): replace with your actual LinkedIn profile URL — the deck links
// to LinkedIn but doesn't include the handle.
const social = [
  { href: "https://www.linkedin.com/", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="grid grid-cols-1 gap-12 py-16 sm:grid-cols-3">
        <div>
          <p className="text-base font-semibold tracking-tight text-foreground">
            OUAQT
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Custom systems for businesses still running on paper, Excel, and
            WhatsApp.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {founder.location}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Navigate</p>
          <ul className="mt-4 space-y-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Connect</p>
          <ul className="mt-4 space-y-3">
            {social.map((item) => (
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
                href={`mailto:${founder.email}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {founder.email}
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col gap-4 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} OUAQT. All rights reserved.</p>
        <p>Built in Nouakchott.</p>
      </Container>
    </footer>
  );
}
