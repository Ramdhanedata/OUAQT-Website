import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";

/*
 * The four things an owner asks before he trusts any of this, answered in
 * his order rather than ours. They are questions, written as questions,
 * because that is how he would say them.
 */
export function Worries({ dict }: { dict: Dictionary }) {
  const home = dict.builderHome;
  const answers = [
    { q: home.worry1, a: home.worry1Body },
    { q: home.worry2, a: home.worry2Body },
    { q: home.worry3, a: home.worry3Body },
    { q: home.worry4, a: home.worry4Body },
  ];

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {home.worriesHeading}
        </h2>

        <dl className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-x-12">
          {answers.map((answer) => (
            <div key={answer.q} className="reveal">
              <dt className="text-xl font-medium text-foreground">{answer.q}</dt>
              <dd className="mt-3 text-base leading-relaxed text-muted-foreground">
                {answer.a}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
