import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import type { Dictionary } from "@/lib/i18n";

// The four real client problems from the pitch deck. These are the specific
// pains OUAQT was hired to fix, not generic marketing copy.
export function Problem({ dict }: { dict: Dictionary }) {
  const problems = [
    { sector: dict.sectors.Mining, pain: dict.problem.items.mining },
    { sector: dict.sectors.Pharmacy, pain: dict.problem.items.pharmacy },
    { sector: dict.sectors.Hospitality, pain: dict.problem.items.hospitality },
    { sector: dict.sectors.Transport, pain: dict.problem.items.transport },
  ];

  return (
    <Section className="border-t border-border">
      <Container>
        <FadeIn className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {dict.problem.eyebrow}
          </p>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {dict.problem.heading}
          </h2>
          <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground">
            {dict.problem.body}
          </p>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {problems.map((item, index) => (
            <FadeIn key={item.sector} delay={(index % 2) * 0.08}>
              <div className="h-full bg-background p-8">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-accent">
                  {item.sector}
                </p>
                <p className="mt-4 text-balance leading-relaxed text-foreground">
                  {item.pain}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
