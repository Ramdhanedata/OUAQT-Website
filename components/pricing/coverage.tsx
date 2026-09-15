import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { pricingTerms } from "@/lib/data/pricing";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { fill } from "@/lib/utils";
import { Check } from "lucide-react";

/* What the licence covers, beside what is always a separate quote. */
export function Coverage({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const p = dict.pricingPage;
  const terms = pricingTerms(lang);

  return (
    <Section className="border-t border-border bg-muted/40 py-16 sm:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          <FadeIn>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {p.included.heading}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {p.included.lead}
            </p>
            <ul className="mt-6 space-y-3">
              {p.included.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span>{fill(item, terms)}</span>
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {p.quoted.heading}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {p.quoted.lead}
            </p>
            <ul className="mt-6 space-y-3">
              {p.quoted.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full border border-muted-foreground"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>

        <FadeIn>
          <p className="mt-12 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {p.decides}
          </p>
        </FadeIn>
      </Container>
    </Section>
  );
}
