import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { founder } from "@/lib/data/founder";
import { ArrowRight } from "lucide-react";

export function AboutTeaser() {
  return (
    <Section className="border-t border-border">
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Who builds it
          </p>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            One person, accountable for the whole system.
          </h2>
          <p className="mt-6 text-balance leading-relaxed text-muted-foreground">
            OUAQT is {founder.name} — the data modeling, the deployments, and
            the historical migrations behind all five live products. You talk
            to the person who builds the thing, not an account manager.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/about" variant="outline">
              About OUAQT
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
