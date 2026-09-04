import { Container } from "@/components/ui/container";
import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// TODO(customize): swap in OUAQT's real social links
const social = [
  { href: "https://twitter.com/ouaqt", label: "X / Twitter" },
  { href: "https://linkedin.com/company/ouaqt", label: "LinkedIn" },
  { href: "https://github.com/ouaqt", label: "GitHub" },
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
            We build quiet, deliberate software for teams who&rsquo;d rather
            ship than explain.
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
              {/* TODO(customize): update contact email */}
              <a
                href="mailto:hello@ouaqt.com"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                hello@ouaqt.com
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col gap-4 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} OUAQT, Inc. All rights reserved.</p>
        <p>Built with quiet ambition.</p>
      </Container>
    </footer>
  );
}
