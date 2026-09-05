import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/motion/fade-in";

// Real, deck-sourced numbers. The 90% / 4hrs->25min figures are the GMM
// mining result, confirmed by that client.
// TODO(adel): update the live-system count as you take on new clients.
const stats = [
  { value: "5", label: "Live systems in production" },
  { value: "5", label: "Sectors served" },
  { value: "90%", label: "Less reconciliation time at GMM" },
  { value: "24-48h", label: "From brief to working build" },
];

export function ImpactBar() {
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
