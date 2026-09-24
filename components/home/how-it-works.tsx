import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";

/*
 * Three steps, in the order he does them. No diagram, no arrows: the whole
 * point is that there is nothing to understand.
 */
export function HowItWorks({ dict }: { dict: Dictionary }) {
  const home = dict.builderHome;
  const steps = [
    { title: home.howStep1, body: home.howStep1Body },
    { title: home.howStep2, body: home.howStep2Body },
    { title: home.howStep3, body: home.howStep3Body },
  ];

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {home.howHeading}
        </h2>

        <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, index) => (
            <li key={step.title} className="reveal">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-base text-muted-foreground">
                {index + 1}
              </span>
              <h3 className="mt-5 text-xl font-medium text-foreground">{step.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
