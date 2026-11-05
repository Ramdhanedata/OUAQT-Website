import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { fill } from "@/lib/utils";

/*
 * Five facts under the hero: how long the Builder takes, that it runs on a
 * phone or a computer, that it needs no internet, where the figures end up,
 * and how long it can be tried for nothing. The trial's length is the setting's, never a number written here.
 */
export function BuilderImpact({ dict, trialDays }: { dict: Dictionary; trialDays: number | null }) {
  const home = dict.builderHome;
  const facts = [
    { value: home.impactMinutes, label: home.impactMinutesLabel },
    { value: home.impactWhere, label: home.impactWhereLabel },
    { value: home.impactOffline, label: home.impactOfflineLabel },
    { value: home.impactData, label: home.impactDataLabel },
    { value: trialDays ? fill(home.impactTrial, { days: trialDays }) : home.impactTrialNoDays, label: home.impactTrialLabel },
  ];

  return (
    <section className="border-y border-border">
      <Container className="grid grid-cols-2 gap-px lg:grid-cols-5">
        {facts.map((fact) => (
          <div key={fact.label} className="py-8 pe-4 last:col-span-2 sm:py-10 lg:last:col-span-1">
            <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{fact.value}</p>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{fact.label}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
