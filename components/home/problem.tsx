import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";

// The four real client problems from the pitch deck. These are the specific
// pains OUAQT was hired to fix, not generic marketing copy.
const problems = [
  {
    sector: "Mining",
    pain: "A daily 4-hour reconciliation process, done by hand.",
  },
  {
    sector: "Pharmacy",
    pain: "Hours of manual data entry for medicine records.",
  },
  {
    sector: "Hospitality",
    pain: "Tax and commission math across services, a common source of billing errors.",
  },
  {
    sector: "Transport",
    pain: "An hour of manual prep before every trip for checkpoint manifests.",
  },
];

export function Problem() {
  return (
    <Section className="border-t border-border">
      <Container>
        <FadeIn className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            The problem
          </p>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Most businesses still run on paper, Excel, and WhatsApp.
          </h2>
          <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground">
            Not because it works, but because they&rsquo;ve never had software
            built for how they actually operate.
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
