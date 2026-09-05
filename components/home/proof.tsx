import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { ArrowRight } from "lucide-react";

// The GMM mining result. It is the strongest proof point OUAQT has, and the
// only one with a client-confirmed number. Keep it that way: don't add
// figures here that a client hasn't signed off on.
export function Proof({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <Section className="border-t border-border">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              {dict.proof.eyebrow}
            </p>
            <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {dict.proof.heading}
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              {dict.proof.body}
            </p>
            <div className="mt-8">
              <Button
                href={localeHref(lang, "/projects/gmm-mining")}
                variant="outline"
              >
                {dict.proof.cta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-border p-8 sm:p-10">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {dict.proof.client}
              </p>
              <p className="mt-2 text-sm text-foreground">{dict.proof.metric}</p>

              <div className="mt-8 flex items-end gap-6">
                <div>
                  <p className="text-sm text-muted-foreground line-through">
                    {dict.proof.beforeValue}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {dict.proof.before}
                  </p>
                </div>
                <ArrowRight className="mb-6 h-5 w-5 shrink-0 text-accent rtl:rotate-180" />
                <div>
                  <p className="text-4xl font-semibold tracking-tight text-accent sm:text-5xl">
                    {dict.proof.afterValue}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {dict.proof.after}
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {dict.proof.reduction}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dict.proof.reductionNote}
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
