import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { adminWords } from "@/builder/admin/language";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * What the AI costs, in the only unit that matters before a bill arrives.
 *
 * Tokens per outcome, because the interesting number is not the total: it is
 * how much is being spent on calls that end up rejected or unusable.
 */
export default async function AiCostPage() {
  const gate = await adminGate();
  const { t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const { data: calls } = await supabase
    .from("ai_calls")
    .select("purpose, outcome, tokens_in, tokens_out, latency_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = calls ?? [];
  const byOutcome = new Map<string, { calls: number; tokens: number }>();
  for (const call of rows) {
    const seen = byOutcome.get(call.outcome) ?? { calls: 0, tokens: 0 };
    seen.calls += 1;
    seen.tokens += (call.tokens_in ?? 0) + (call.tokens_out ?? 0);
    byOutcome.set(call.outcome, seen);
  }

  const totalTokens = rows.reduce(
    (sum, call) => sum + (call.tokens_in ?? 0) + (call.tokens_out ?? 0),
    0
  );

  return (
    <>
      <AdminNav current="/admin/cout-ia" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-2xl font-semibold text-foreground">{t.aiCost.title}</h1>

      {rows.length === 0 ? (
        <p className="mt-3 text-base text-muted-foreground">
          {t.aiCost.none}
        </p>
      ) : (
        <>
          <p className="mt-3 text-base text-foreground">
            {fill(t.aiCost.total, { calls: rows.length.toLocaleString(locale), tokens: totalTokens.toLocaleString(locale) })}
          </p>
          <table className="mt-6 w-full text-start">
            <thead>
              <tr className="border-b border-border text-base text-muted-foreground">
                <th className="py-2 text-start font-normal">{t.aiCost.outcome}</th>
                <th className="py-2 text-end font-normal">{t.aiCost.calls}</th>
                <th className="py-2 text-end font-normal">{t.aiCost.tokens}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(byOutcome.entries()).map(([outcome, seen]) => (
                <tr key={outcome} className="border-b border-border text-base">
                  <td className="py-2 text-foreground">{outcome}</td>
                  <td className="py-2 text-end text-foreground">{seen.calls}</td>
                  <td className="py-2 text-end text-foreground">
                    {seen.tokens.toLocaleString(locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
