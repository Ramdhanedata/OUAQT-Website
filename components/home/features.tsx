import { FadeIn } from "@/components/motion/fade-in";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { ChartColumn, Languages, Network, Package, Receipt, ShoppingCart, Users, Wallet } from "lucide-react";

/*
 * What every piece of software the Builder makes can do, whatever the trade.
 * Each line is a switch the interview really sets or a screen the app really
 * has; nothing here is on a roadmap.
 */
const icons = [ShoppingCart, Package, ChartColumn, Users, Wallet, Receipt, Network, Languages];

export function Features({ dict }: { dict: Dictionary }) {
  const home = dict.builderHome;

  return (
    <section className="border-t border-border bg-surface py-20 sm:py-28">
      <Container>
        <FadeIn className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.featuresEyebrow}</p>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {home.featuresHeading}
          </h2>
        </FadeIn>

        <ul className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {home.features.map((feature, index) => {
            const Icon = icons[index % icons.length];
            return (
              <li key={feature.title}>
                <FadeIn delay={(index % 4) * 0.05}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-medium text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{feature.body}</p>
                </FadeIn>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
