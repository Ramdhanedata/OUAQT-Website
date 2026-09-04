import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { TeamGrid } from "@/components/about/team-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — OUAQT",
  description: "Our mission, our team, and how we work.",
};

const values = [
  {
    title: "Say less, ship more",
    description:
      "We’d rather demonstrate an idea in working software than pitch it in a deck.",
  },
  {
    title: "Depth over breadth",
    description:
      "We take on fewer projects so each one gets senior attention from start to finish.",
  },
  {
    title: "Own the outcome",
    description:
      "We measure our work by what it changes for the people using it, not what it looks like in a portfolio.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section className="pt-32 sm:pt-40">
        <Container>
          <FadeIn className="max-w-2xl">
            <p className="text-sm font-medium tracking-tight text-accent">
              About OUAQT
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              We build the software we wished someone had built for us.
            </h1>
            {/* TODO(customize): replace with OUAQT's real founding story */}
            <p className="mt-6 leading-relaxed text-muted-foreground">
              OUAQT started as a small team of engineers and designers tired
              of watching good ideas get buried under bloated software. We
              set out to build a studio that treats every product like it&rsquo;s
              the only one we&rsquo;re working on — because most of the time,
              it nearly is.
            </p>
          </FadeIn>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <FadeIn>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              How we work
            </h2>
          </FadeIn>
          <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {values.map((value, index) => (
              <FadeIn key={value.title} delay={index * 0.1}>
                <p className="text-5xl font-semibold tracking-tight text-accent/30">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-lg font-medium tracking-tight text-foreground">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </FadeIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <FadeIn>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              The team
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              {/* TODO(customize): update headcount / hiring status */}
              A small, senior team — currently four people, growing slowly
              and deliberately.
            </p>
          </FadeIn>
          <div className="mt-14">
            <TeamGrid />
          </div>
        </Container>
      </Section>
    </>
  );
}
