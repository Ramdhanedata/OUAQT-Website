import { FadeIn } from "@/components/motion/fade-in";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";

/*
 * What every piece of software the Builder makes can do, whatever the trade.
 * Each line is a switch the interview really sets or a screen the app really
 * has; nothing here is on a roadmap.
 */
export function Features({ dict }: { dict: Dictionary }) {
  const home = dict.builderHome;

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container>
        <FadeIn className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.featuresEyebrow}</p>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {home.featuresHeading}
          </h2>
        </FadeIn>

        <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {home.features.map((feature, index) => (
            <li key={feature.title}>
              <FadeIn delay={(index % 4) * 0.05} className="border-t border-border pt-5">
                <h3 className="text-lg font-medium text-foreground">{feature.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{feature.body}</p>
              </FadeIn>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
