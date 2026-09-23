import { CodeRequestActions, ReviveCode } from "@/builder/admin/code-requests";
import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { adminWords } from "@/builder/admin/language";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";
import { wordFor } from "@/builder/admin/copy";
import { LIFETIME_DAYS } from "@/builder/config-code/code";
import { MESSAGE } from "@/builder/notify/whatsapp";

/* Numbers are kept as their last eight digits: Mauritanian, so 222 in front. */
const COUNTRY = "222"; // not-a-rule: the one country the product is sold in

function shownPhone(phone: string): string {
  return `+${COUNTRY} ${phone.replace(/(\d{2})(?=\d)/g, "$1 ")}`;
}

/*
 * What owners asked for and could not have.
 *
 * Two lists that are really one question: what should we build next. The
 * feature requests come from "Expliquer avec mes mots" when the AI could not
 * turn a sentence into a setting, and the leads come from owners whose trade
 * has no pack yet.
 *
 * Above them, the codes de configuration owners asked for again, which staff
 * send by hand until the WhatsApp send is connected.
 */
export default async function RequestsPage() {
  const gate = await adminGate();
  const { t, locale } = adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const [{ data: requests }, { data: leads }, { data: codeRequests }] = await Promise.all([
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
    supabase
      .from("configuration_code_requests")
      .select("id, phone, created_at, draft:builder_drafts (code, status, locale, pack)")
      .is("handled_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  type Waiting = {
    id: string;
    phone: string;
    created_at: string;
    draft: { code: string; status: string; locale: string; pack: string | null } | null;
  };
  const waiting = ((codeRequests ?? []) as unknown as Waiting[]).filter((one) => one.draft?.code);

  return (
    <>
      <AdminNav current="/admin/demandes" staff={gate.staff.name ?? t.staffFallback} />

      <section className="mb-12">
        <h1 className="text-2xl font-semibold text-foreground">{t.requests.codesTitle}</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">{t.requests.codesIntro}</p>
        {waiting.length === 0 ? (
          <p className="mt-3 text-base text-muted-foreground">{t.requests.noCodes}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {waiting.map((one) => {
              const draft = one.draft!;
              const language = draft.locale === "ar" || draft.locale === "en" ? draft.locale : "fr";
              const link = `https://wa.me/${COUNTRY}${one.phone}?text=${encodeURIComponent(MESSAGE[language](draft.code))}`;
              const expired = draft.status === "expired";
              return (
                <li key={one.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="text-base text-foreground">
                    <bdi dir="ltr" className="font-mono">{draft.code}</bdi>
                    <span className="text-muted-foreground">
                      {" · "}
                      <bdi dir="ltr">{shownPhone(one.phone)}</bdi>
                      {draft.pack ? ` · ${wordFor(t.packs, draft.pack)}` : ""}
                      {" · "}
                      {new Date(one.created_at).toLocaleDateString(locale)}
                      {expired ? ` · ${t.requests.expired}` : ""}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-3">
                    <a href={link} target="_blank" rel="noreferrer" className="text-base text-foreground underline">
                      {t.requests.sendOnWhatsApp}
                    </a>
                    <CodeRequestActions t={t.requests} requestId={one.id} code={draft.code} expired={expired} days={LIFETIME_DAYS} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <h2 className="mt-8 text-base font-medium text-foreground">{t.requests.reviveTitle}</h2>
        <ReviveCode t={t.requests} days={LIFETIME_DAYS} />
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground">{t.requests.title}</h2>
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
