import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import type { Dictionary } from "@/lib/i18n";
import { Ear, Hammer, LifeBuoy } from "lucide-react";

/*
 * How an engagement actually runs. Numbered here on purpose: unlike the three
 * principles, these really are sequential, so the numbers carry information.
 */
export function Process({ dict }: { dict: Dictionary }) {
  const steps = [
    { icon: Ear, ...dict.process.steps.listen },
    { icon: Hammer, ...dict.process.steps.build },
    { icon: LifeBuoy, ...dict.process.steps.stay },
  ];

  return (
    <Section className="border-t border-border">
      <Container>
        <FadeIn className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {dict.process.eyebrow}
          </p>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {dict.process.heading}
          </h2>
          <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground">
            {dict.process.body}
          </p>
        </FadeIn>

        <ol className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, index) => (
            <FadeIn key={step.title} delay={index * 0.08}>
              <li className="list-none">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/40 text-sm font-semibold text-accent">
                    {index + 1}
                  </span>
                  <step.icon
                    className="h-5 w-5 text-accent/70"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </div>
                <h3 className="mt-5 text-balance text-lg font-medium leading-snug tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            </FadeIn>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
