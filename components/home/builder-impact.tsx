import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";

/*
 * Three facts about the builder, not about our past work.
 *
 * The old bar counted systems and named the time after a first visit, which
 * belongs to the custom path and has moved there. What an owner reading this
 * page wants to know is how long it takes, whether it needs internet, and
 * where his figures end up.
 */
export function BuilderImpact({ dict }: { dict: Dictionary }) {
  const home = dict.builderHome;
  const facts = [
    { value: home.impactMinutes, label: home.impactMinutesLabel },
    { value: home.impactOffline, label: home.impactOfflineLabel },
    { value: home.impactData, label: home.impactDataLabel },
  ];

  return (
    <section className="border-y border-border bg-surface">
      <Container className="grid gap-8 py-12 sm:grid-cols-3 sm:gap-6">
        {facts.map((fact) => (
          <div key={fact.label}>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {fact.value}
            </p>
            <p className="mt-1 text-base text-muted-foreground">{fact.label}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
