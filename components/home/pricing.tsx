import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { ArrowRight, Check } from "lucide-react";

export function Pricing({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const p = dict.pricing;
  const includes = [
    p.includes.system,
    p.includes.training,
    p.includes.warranty,
    p.includes.updates,
  ];

  return (
    <Section className="border-t border-border bg-muted/40">
      <Container>
        <FadeIn className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {p.eyebrow}
          </p>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {p.heading}
          </h2>
          <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground">
            {p.body}
          </p>
        </FadeIn>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-14">
          <FadeIn className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-surface p-8">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {p.priceLabel}
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {p.price}
              </p>

              {/* Genuine former price: 45,000 down to 40,000. */}
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm text-muted-foreground">
                  {p.compareLabel}
                </p>
                <p className="mt-1 text-lg text-muted-foreground line-through decoration-accent/60">
                  {p.compare}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.compareNote}
                </p>
              </div>

              <div className="mt-7">
                <Button
                  href={localeHref(lang, "/contact")}
                  variant="accent"
                  className="w-full justify-center"
                >
                  {p.cta}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1} className="lg:col-span-3">
            <ul className="grid grid-cols-1 gap-7 sm:grid-cols-2">
              {includes.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <Check
                    className="mt-1 h-5 w-5 shrink-0 text-accent"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <div>
                    <h3 className="text-base font-medium tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
