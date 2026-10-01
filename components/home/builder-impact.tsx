import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { fill } from "@/lib/utils";

/*
 * Four facts under the hero: how long the Builder takes, that it needs no
 * internet, where the figures end up, and how long it can be tried for
 * nothing. The trial's length is the setting's, never a number written here.
 */
export function BuilderImpact({ dict, trialDays }: { dict: Dictionary; trialDays: number | null }) {
  const home = dict.builderHome;
  const facts = [
    { value: home.impactMinutes, label: home.impactMinutesLabel },
    { value: home.impactOffline, label: home.impactOfflineLabel },
    { value: home.impactData, label: home.impactDataLabel },
    { value: trialDays ? fill(home.impactTrial, { days: trialDays }) : home.impactTrialNoDays, label: home.impactTrialLabel },
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
