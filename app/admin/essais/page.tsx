import { adminGate, adminOpenForTesting } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { TestEndTrial } from "@/builder/admin/test-end-trial";
import { TrialOverride } from "@/builder/admin/trial-override";
import { adminClient } from "@/builder/db/server";
import { wordFor } from "@/builder/admin/copy";
import { adminWords } from "@/builder/admin/language";
import { fill } from "@/lib/utils";

/*
 * Trials: the ones we flagged, and the ones we refused.
 *
 * Nothing on this page happened automatically to anybody. A flag is a reason
 * to look, and a refusal is a person waiting on WhatsApp. The button at the
 * bottom is how either of them ends.
 */


export default async function TrialsPage() {
  const gate = await adminGate();
  const { t, locale } = adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const [{ data: claims }, { data: refused }, { data: businesses }] = await Promise.all([
    supabase
      .from("trial_claims")
      .select("id, business_id, name, phone, signals, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("audit_events")
      .select("subject_id, detail, created_at")
      .eq("action", "trial_refused")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("businesses").select("id, name_latin").order("name_latin").limit(200),
  ]);

  const flagged = (claims ?? []).filter(
    (one) => Array.isArray(one.signals) && one.signals.length > 0
  );

  return (
    <>
      <AdminNav current="/admin/essais" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-2xl font-semibold text-foreground">{t.trials.title}</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {t.trials.intro}
      </p>

      <section className="mt-10">
        <h2 className="text-base font-medium text-foreground">
          {fill(t.trials.flagged, { count: flagged.length })}
        </h2>
        {flagged.length === 0 ? (
          <p className="mt-2 text-base text-muted-foreground">{t.trials.nothingFlagged}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {flagged.map((one) => (
              <li key={one.id} className="py-3">
                <p className="text-base text-foreground">
                  {one.name || t.trials.unnamed}
                  <span className="text-muted-foreground">
                    {" · "}
                    {new Date(one.created_at as string).toLocaleDateString(locale)}
                  </span>
                </p>
                <p className="mt-1 text-base text-muted-foreground">
                  {(one.signals as string[]).map((signal) => wordFor(t.trials.signals, signal)).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-base font-medium text-foreground">
          {fill(t.trials.refused, { count: (refused ?? []).length })}
        </h2>
        {(refused ?? []).length === 0 ? (
          <p className="mt-2 text-base text-muted-foreground">{t.trials.nobodyRefused}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {(refused ?? []).map((one, index) => {
              const detail = one.detail as { because?: string } | null;
              return (
                <li key={index} className="py-3">
                  <p className="text-base text-foreground">
                    {detail?.because ? wordFor(t.trials.refusals, detail.because) : t.trials.refusedFallback}
                  </p>
                  <p className="mt-1 text-base text-muted-foreground">
                    {new Date(one.created_at as string).toLocaleString(locale)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-base font-medium text-foreground">{t.trials.grantTitle}</h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {t.trials.grantIntro}
        </p>
        <TrialOverride
          t={t.trials}
          businesses={(businesses ?? []).map((one) => ({
            id: one.id as string,
            name: one.name_latin as string,
          }))}
        />
      </section>

      {/* The test version only: see the end of a trial without waiting thirty days. */}
      {adminOpenForTesting() ? (
        <section className="mt-10">
          <h2 className="text-base font-medium text-foreground">{t.trials.testEndTitle}</h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">{t.trials.testEndIntro}</p>
          <TestEndTrial
            t={t.trials}
            businesses={(businesses ?? []).map((one) => ({ id: one.id as string, name: one.name_latin as string }))}
          />
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-base font-medium text-foreground">
          {fill(t.trials.all, { count: (claims ?? []).length })}
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {(claims ?? []).map((one) => (
            <li key={one.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="text-base text-foreground">{one.name || t.trials.unnamed}</span>
              <span className="text-base text-muted-foreground">
                {new Date(one.created_at as string).toLocaleDateString(locale)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
