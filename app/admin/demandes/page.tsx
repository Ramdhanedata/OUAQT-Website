import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { adminWords } from "@/builder/admin/language";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";
import { wordFor } from "@/builder/admin/copy";

/*
 * What owners asked for and could not have.
 *
 * Two lists that are really one question: what should we build next. The
 * feature requests come from "Expliquer avec mes mots" when the AI could not
 * turn a sentence into a setting, and the leads come from owners whose trade
 * has no pack yet.
 */
export default async function RequestsPage() {
  const gate = await adminGate();
  const { t, locale } = adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const [{ data: requests }, { data: leads }] = await Promise.all([
    supabase
      .from("feature_requests")
      .select("id, pack, question_id, text, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("leads_other_business")
      .select("id, business_type, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <>
      <AdminNav current="/admin/demandes" staff={gate.staff.name ?? t.staffFallback} />

      <section className="mb-12">
        <h1 className="text-2xl font-semibold text-foreground">{t.requests.title}</h1>
        {(requests ?? []).length === 0 ? (
          <p className="mt-3 text-base text-muted-foreground">
            {t.requests.nothing}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {(requests ?? []).map((one) => (
              <li key={one.id} className="py-3">
                <p className="text-base text-foreground">{one.text}</p>
                <p className="mt-1 text-base text-muted-foreground">
                  {one.pack ? wordFor(t.packs, one.pack) : t.requests.noPack} ·{" "}
                  {one.question_id ?? t.requests.noQuestion} ·{" "}
                  {new Date(one.created_at).toLocaleDateString(locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">{t.requests.leadsTitle}</h2>
        {(leads ?? []).length === 0 ? (
          <p className="mt-3 text-base text-muted-foreground">
            {t.requests.noLeads}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {(leads ?? []).map((lead) => (
              <li key={lead.id} className="flex flex-wrap justify-between gap-3 py-3">
                <span className="text-base text-foreground">{lead.business_type}</span>
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                  className="text-base text-foreground underline"
                >
                  <bdi dir="ltr">{lead.phone}</bdi>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
