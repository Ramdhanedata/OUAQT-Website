import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { Compass, Layers, Zap } from "lucide-react";

const pillars = [
  {
    icon: Compass,
    title: "Clarity first",
    description:
      "We start every engagement by cutting scope to the smallest thing that proves the idea works.",
  },
  {
    icon: Layers,
    title: "Systems, not screens",
    description:
      "We design the underlying model before the interface, so what we ship holds up under real use.",
  },
  {
    icon: Zap,
    title: "Built to last",
    description:
      "No throwaway prototypes. Everything we build is production-grade from the first commit.",
  },
];

export function Pillars() {
  return (
    <Section>
      <Container>
        <FadeIn>
          <h2 className="max-w-lg text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What we do
          </h2>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {pillars.map((pillar, index) => (
            <FadeIn key={pillar.title} delay={index * 0.1}>
              <pillar.icon
                className="h-6 w-6 text-accent"
                strokeWidth={1.5}
              />
              <h3 className="mt-5 text-lg font-medium tracking-tight text-foreground">
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
