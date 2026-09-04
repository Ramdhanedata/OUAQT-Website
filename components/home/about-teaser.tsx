import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { ArrowRight } from "lucide-react";

export function AboutTeaser() {
  return (
    <Section>
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A small studio, on purpose.
          </h2>
          <p className="mt-6 text-balance leading-relaxed text-muted-foreground">
            OUAQT stays deliberately small so every project gets our full
            attention. We&rsquo;re a team of designers and engineers who&rsquo;ve
            spent our careers building the products we wished existed —
            now we build them for you.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/about" variant="outline">
              More about OUAQT
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
