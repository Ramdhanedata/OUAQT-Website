import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { TrialOverride } from "@/builder/admin/trial-override";
import { adminClient } from "@/builder/db/server";
import type { Signal } from "@/builder/licence/trial";

/*
 * Trials: the ones we flagged, and the ones we refused.
 *
 * Nothing on this page happened automatically to anybody. A flag is a reason
 * to look, and a refusal is a person waiting on WhatsApp. The button at the
 * bottom is how either of them ends.
 */

const why: Record<Signal, string> = {
  same_logo: "Même logo qu'un essai précédent",
  same_products: "Même liste de produits",
  similar_name: "Nom de commerce très proche",
  similar_address: "Adresse très proche",
};

const refusals: Record<string, string> = {
  same_machine: "Même ordinateur qu'un essai précédent",
  same_phone: "Même numéro de téléphone",
  same_business: "Ce commerce a déjà eu son essai",
  no_fingerprint: "Le logiciel n'a envoyé aucune empreinte de machine",
};

export default async function TrialsPage() {
  const gate = await adminGate();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">No database configured.</p>;

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
      <AdminNav current="/admin/essais" staff={gate.staff.name ?? "staff"} />
      <h1 className="text-2xl font-semibold text-foreground">Essais</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Un essai par commerce. Ce qui est signalé ci-dessous n&apos;a bloqué
        personne&nbsp;: c&apos;est une raison de regarder, pas une accusation.
      </p>

      <section className="mt-10">
        <h2 className="text-base font-medium text-foreground">
          Possible essai répété ({flagged.length})
        </h2>
        {flagged.length === 0 ? (
          <p className="mt-2 text-base text-muted-foreground">Rien à signaler.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {flagged.map((one) => (
              <li key={one.id} className="py-3">
                <p className="text-base text-foreground">
                  {one.name || "Sans nom"}
                  <span className="text-muted-foreground">
                    {" · "}
                    {new Date(one.created_at as string).toLocaleDateString("fr")}
                  </span>
                </p>
                <p className="mt-1 text-base text-muted-foreground">
                  {(one.signals as Signal[]).map((signal) => why[signal] ?? signal).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-base font-medium text-foreground">
          Refusés, à rappeler ({(refused ?? []).length})
        </h2>
        {(refused ?? []).length === 0 ? (
          <p className="mt-2 text-base text-muted-foreground">Personne.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {(refused ?? []).map((one, index) => {
              const detail = one.detail as { because?: string } | null;
              return (
                <li key={index} className="py-3">
                  <p className="text-base text-foreground">
                    {refusals[detail?.because ?? ""] ?? detail?.because ?? "Refusé"}
                  </p>
                  <p className="mt-1 text-base text-muted-foreground">
                    {new Date(one.created_at as string).toLocaleString("fr")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-base font-medium text-foreground">Donner un essai</h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Pour un ordinateur acheté d&apos;occasion, une machine réparée que
          nous n&apos;avons pas reconnue, ou toute personne que nous avons
          refusée à tort. Son essai démarre à sa prochaine activation.
        </p>
        <TrialOverride
          businesses={(businesses ?? []).map((one) => ({
            id: one.id as string,
            name: one.name_latin as string,
          }))}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-base font-medium text-foreground">
          Tous les essais ({(claims ?? []).length})
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {(claims ?? []).map((one) => (
            <li key={one.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="text-base text-foreground">{one.name || "Sans nom"}</span>
              <span className="text-base text-muted-foreground">
                {new Date(one.created_at as string).toLocaleDateString("fr")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
