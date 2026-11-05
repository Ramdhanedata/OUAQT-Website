import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { fill } from "@/lib/utils";
import { Gift, MonitorSmartphone, ShieldCheck, Timer, WifiOff } from "lucide-react";

/*
 * Five facts under the hero: how long the Builder takes, that it runs on a
 * phone or a computer, that it needs no internet, where the figures end up,
 * and how long it can be tried for nothing. The trial's length is the setting's, never a number written here.
 */
export function BuilderImpact({ dict, trialDays }: { dict: Dictionary; trialDays: number | null }) {
  const home = dict.builderHome;
  const facts = [
    { Icon: Timer, value: home.impactMinutes, label: home.impactMinutesLabel },
    { Icon: MonitorSmartphone, value: home.impactWhere, label: home.impactWhereLabel },
    { Icon: WifiOff, value: home.impactOffline, label: home.impactOfflineLabel },
    { Icon: ShieldCheck, value: home.impactData, label: home.impactDataLabel },
    { Icon: Gift, value: trialDays ? fill(home.impactTrial, { days: trialDays }) : home.impactTrialNoDays, label: home.impactTrialLabel },
  ];

  return (
    <section>
      <Container>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-card lg:grid-cols-5">
          {facts.map(({ Icon, value, label }) => (
            <li key={label} className="bg-surface p-5 last:col-span-2 sm:p-6 lg:last:col-span-1">
              <Icon className="h-5 w-5 text-app-gold-ink" strokeWidth={1.9} />
              <p className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{value}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
