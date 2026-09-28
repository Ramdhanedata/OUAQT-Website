import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";

/*
 * Four facts under the hero: how long the Builder takes, that it needs no
 * internet, where the figures end up, and how much software we already run
 * for clients. The last one is the custom work's, and it is what tells a
 * business owner meeting a young company that it has done this before.
 */
export function BuilderImpact({ dict }: { dict: Dictionary }) {
  const home = dict.builderHome;
  const facts = [
    { value: home.impactMinutes, label: home.impactMinutesLabel },
    { value: home.impactOffline, label: home.impactOfflineLabel },
    { value: home.impactData, label: home.impactDataLabel },
    { value: home.impactSystems, label: home.impactSystemsLabel },
  ];

  return (
    <section className="border-y border-border">
      <Container className="grid grid-cols-2 gap-px lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="py-8 pe-4 sm:py-10">
            <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{fact.value}</p>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{fact.label}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
