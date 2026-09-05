import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { Blocks, Bot, DatabaseZap } from "lucide-react";

// The three principles behind every OUAQT build, from the pitch deck.
const pillars = [
  {
    icon: Blocks,
    title: "Built around the real workflow, not a template",
    description:
      "Every system is designed from how your team actually works, including the language they work in. The GMM mining system runs French, Arabic, and English because that is how field crews log data.",
  },
  {
    icon: Bot,
    title: "Automation handles the repetition, people handle the exceptions",
    description:
      "The pharmacy system fills medicine records from past entries instead of asking staff to retype them. What is left is the work that genuinely needs a person.",
  },
  {
    icon: DatabaseZap,
    title: "Full migration, isolated per client",
    description:
      "Years of paper and spreadsheet history come across with you, so nobody starts from a blank system. And no client's data ever touches another's.",
  },
];

export function Pillars() {
  return (
    <Section className="border-t border-border">
      <Container>
        <FadeIn className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            The solution
          </p>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Custom digital systems, built around how each business actually
            works.
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
                {pillar.description}
              </p>
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
