import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { adminWords } from "@/builder/admin/language";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";
import { wordFor } from "@/builder/admin/copy";

/*
 * Where owners stop.
 *
 * Read as a funnel because that is the only shape that answers the question:
 * of everyone who started, how many were still there at step three. A count
 * per step on its own hides the drop.
 */

export default async function FunnelPage() {
  const gate = await adminGate();
  const { t } = adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const { data: events } = await supabase
    .from("builder_events")
    .select("session_hash, pack, step, device_class")
    .eq("event", "reached")
    .limit(5000);

  /* One session counts once per step, however many times it came back. */
  const reached = new Map<number, Set<string>>();
  const byPack = new Map<string, Set<string>>();
  const byDevice = new Map<string, Set<string>>();

  for (const row of events ?? []) {
    const step = row.step ?? 0;
    if (!reached.has(step)) reached.set(step, new Set());
    reached.get(step)!.add(row.session_hash);

    const pack = row.pack ? wordFor(t.packs, row.pack) : t.funnel.noPack;
    if (!byPack.has(pack)) byPack.set(pack, new Set());
    byPack.get(pack)!.add(row.session_hash);

    const device = row.device_class ?? t.funnel.unknown;
    if (!byDevice.has(device)) byDevice.set(device, new Set());
    byDevice.get(device)!.add(row.session_hash);
  }

  const started = reached.get(0)?.size ?? 0;

  return (
    <>
      <AdminNav current="/admin/parcours" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-2xl font-semibold text-foreground">{t.funnel.title}</h1>

      {started === 0 ? (
        <p className="mt-3 text-base text-muted-foreground">
          {t.funnel.nobody}
        </p>
      ) : (
        <>
          <table className="mt-6 w-full">
            <thead>
              <tr className="border-b border-border text-base text-muted-foreground">
                <th className="py-2 text-start font-normal">{t.funnel.step}</th>
                <th className="py-2 text-end font-normal">{t.funnel.reached}</th>
                <th className="py-2 text-end font-normal">{t.funnel.perHundred}</th>
              </tr>
            </thead>
            <tbody>
              {t.funnel.steps.map((label, step) => {
                const count = reached.get(step)?.size ?? 0;
                return (
                  <tr key={label} className="border-b border-border text-base">
                    <td className="py-2 text-foreground">{label}</td>
                    <td className="py-2 text-end text-foreground">{count}</td>
                    <td className="py-2 text-end text-muted-foreground">
                      {Math.round((count / started) * 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <Split title={t.funnel.byPack} rows={byPack} />
            <Split title={t.funnel.byDevice} rows={byDevice} />
          </div>
        </>
      )}
    </>
  );
}

function Split({ title, rows }: { title: string; rows: Map<string, Set<string>> }) {
  return (
    <section>
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      <ul className="mt-2 divide-y divide-border">
        {Array.from(rows.entries()).map(([label, sessions]) => (
          <li key={label} className="flex justify-between py-2 text-base">
            <span className="text-foreground">{label}</span>
            <span className="text-muted-foreground">{sessions.size}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
