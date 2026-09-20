import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";

/*
 * What the AI costs, in the only unit that matters before a bill arrives.
 *
 * Tokens per outcome, because the interesting number is not the total: it is
 * how much is being spent on calls that end up rejected or unusable.
 */
export default async function AiCostPage() {
  const gate = await adminGate();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">No database configured.</p>;

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
      <AdminNav current="/admin/cout-ia" staff={gate.staff.name ?? "staff"} />
      <h1 className="text-2xl font-semibold text-foreground">Coût IA</h1>

      {rows.length === 0 ? (
        <p className="mt-3 text-base text-muted-foreground">
          Aucun appel pour l&apos;instant.
        </p>
      ) : (
        <>
          <p className="mt-3 text-base text-foreground">
            {rows.length} appels, {totalTokens.toLocaleString("fr")} jetons au total.
          </p>
          <table className="mt-6 w-full text-start">
            <thead>
              <tr className="border-b border-border text-base text-muted-foreground">
                <th className="py-2 text-start font-normal">Résultat</th>
                <th className="py-2 text-end font-normal">Appels</th>
                <th className="py-2 text-end font-normal">Jetons</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(byOutcome.entries()).map(([outcome, seen]) => (
                <tr key={outcome} className="border-b border-border text-base">
                  <td className="py-2 text-foreground">{outcome}</td>
                  <td className="py-2 text-end text-foreground">{seen.calls}</td>
                  <td className="py-2 text-end text-foreground">
                    {seen.tokens.toLocaleString("fr")}
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
