import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/motion/fade-in";
import type { Dictionary } from "@/lib/i18n";

// Real, deck-sourced numbers. The 90% figure is the GMM mining result,
// confirmed by that client.
// TODO(adel): update the live-system count as you take on new clients.
export function ImpactBar({ dict }: { dict: Dictionary }) {
  const stats = [
    { value: "5", label: dict.impact.liveSystems },
    { value: "5", label: dict.impact.sectors },
    { value: "90%", label: dict.impact.reduction },
    { value: "24-48h", label: dict.impact.buildTime },
  ];

  return (
    <Container className="pb-8">
      <FadeIn>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-y border-border py-12 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-semibold tracking-tight text-accent sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </FadeIn>
    </Container>
  );
}
