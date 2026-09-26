import { FadeIn } from "@/components/motion/fade-in";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { MessageCircle, ShieldCheck, Smartphone, WifiOff } from "lucide-react";

/*
 * The four things an owner asks before trusting a young company with his
 * till: the internet, his figures, how he pays, and who answers when
 * something goes wrong.
 */
const icons = [WifiOff, ShieldCheck, Smartphone, MessageCircle];

export function Why({ dict }: { dict: Dictionary }) {
  const home = dict.builderHome;

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <FadeIn>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.whyEyebrow}</p>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {home.whyHeading}
          </h2>
        </FadeIn>

        <dl className="grid gap-4 sm:grid-cols-2">
          {home.why.map((item, index) => {
            const Icon = icons[index % icons.length];
            return (
              <FadeIn key={item.title} delay={(index % 2) * 0.06} className="rounded-2xl border border-border bg-surface p-6">
                <Icon className="h-5 w-5 text-accent" />
                <dt className="mt-4 text-lg font-medium text-foreground">{item.title}</dt>
                <dd className="mt-2 text-base leading-relaxed text-muted-foreground">{item.body}</dd>
              </FadeIn>
            );
          })}
        </dl>
      </Container>
    </section>
  );
}
