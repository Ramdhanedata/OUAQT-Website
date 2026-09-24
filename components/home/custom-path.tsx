import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";

/*
 * The second path, for the trades the builder does not cover and the work
 * that is too particular for any pack.
 *
 * Quiet on purpose. It is a real offer and it pays for the rest, but an owner
 * who came here to build a till should not have to step over it.
 */
export function CustomPath({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const home = dict.builderHome;

  return (
    <section id="sur-mesure" className="border-t border-border py-20 sm:py-28">
      <Container>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {home.customHeading}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {home.customBody}
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {[
            { href: localeHref(lang, "/projects"), label: home.customProjects },
            { href: localeHref(lang, "/pricing"), label: home.customPricing },
            { href: localeHref(lang, "/contact"), label: home.customTalk },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[48px] items-center text-base text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
