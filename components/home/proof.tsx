import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { ArrowRight } from "lucide-react";

// The GMM mining result. It is the strongest proof point OUAQT has, and the
// only one with a client-confirmed number. Keep it that way: don't add
// figures here that a client hasn't signed off on.
export function Proof() {
  return (
    <Section className="border-t border-border">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Proof it works
            </p>
            <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              One number that says it all.
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              GMM&rsquo;s field teams were reconciling bloc movement by hand,
              four hours a day, across three languages. The system we built
              for them does it in twenty-five minutes.
            </p>
            <div className="mt-8">
              <Button href="/projects/gmm-mining" variant="outline">
                Read the GMM case
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-border p-8 sm:p-10">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                GMM · Mining client
              </p>
              <p className="mt-2 text-sm text-foreground">
                Daily reconciliation
              </p>

              <div className="mt-8 flex items-end gap-6">
                <div>
                  <p className="text-sm text-muted-foreground line-through">
                    4 hours
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Before
                  </p>
                </div>
                <ArrowRight className="mb-6 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-4xl font-semibold tracking-tight text-accent sm:text-5xl">
                    25 min
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    After
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  90% reduction
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  In reconciliation time, confirmed by the client.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
