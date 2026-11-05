import { FadeIn } from "@/components/motion/fade-in";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { BarChart3, HandCoins, Languages, Package, ReceiptText, ShoppingCart, Smartphone, Wallet, type LucideIcon } from "lucide-react";

/*
 * What every piece of software the Builder makes can do, whatever the trade.
 * Each line is a switch the interview really sets or a screen the app really
 * has; nothing here is on a roadmap.
 *
 * The icons follow the order of the features in the dictionaries: till,
 * stock, reports, credit, cash close, receipts, phone, languages.
 */
const ICONS: LucideIcon[] = [ShoppingCart, Package, BarChart3, HandCoins, Wallet, ReceiptText, Smartphone, Languages];

export function Features({ dict }: { dict: Dictionary }) {
  const home = dict.builderHome;

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container>
        <FadeIn className="max-w-2xl">
          <p className="eyebrow">{home.featuresEyebrow}</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {home.featuresHeading}
          </h2>
        </FadeIn>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {home.features.map((feature, index) => {
            const Icon = ICONS[index] ?? ShoppingCart;
            return (
              <li key={feature.title}>
                <FadeIn
                  delay={(index % 4) * 0.05}
                  className="group h-full rounded-3xl border border-border bg-surface p-6 transition-shadow duration-300 hover:shadow-card"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-app-gold-ink transition-colors group-hover:bg-foreground group-hover:text-background">
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{feature.title}</h3>
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
