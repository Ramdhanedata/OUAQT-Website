import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import type { Dictionary } from "@/lib/i18n";
import { Blocks, Bot, DatabaseZap } from "lucide-react";

// The three principles behind every OUAQT build, from the pitch deck.
export function Pillars({ dict }: { dict: Dictionary }) {
  const pillars = [
    { icon: Blocks, ...dict.pillars.workflow },
    { icon: Bot, ...dict.pillars.automation },
    { icon: DatabaseZap, ...dict.pillars.migration },
  ];

  return (
    <Section className="border-t border-border">
      <Container>
        <FadeIn className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {dict.pillars.eyebrow}
          </p>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {dict.pillars.heading}
          </h2>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-10">
          {pillars.map((pillar, index) => (
            <FadeIn key={pillar.title} delay={index * 0.1}>
              <pillar.icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
              <h3 className="mt-5 text-balance text-lg font-medium leading-snug tracking-tight text-foreground">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {pillar.body}
              </p>
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
