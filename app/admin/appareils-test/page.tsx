import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { AdminNav } from "@/builder/admin/nav";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { TesterDevices, type TesterRow } from "@/builder/admin/tester-devices";
import { adminClient } from "@/builder/db/server";
import { ENROL_MINUTES } from "@/builder/licence/tester-pass";

/*
 * OUAQT's own test devices (0040): Adel's Mac and iPhone, whose shops always
 * get their trial and take no device place. A computer is on the list by its
 * fingerprint; an iPhone by the pass it took from a QR code made here. The
 * installs an iPhone's pass was recognised in are counted under it, not
 * listed one by one.
 */
export default async function TesterDevicesPage() {
  const gate = await adminGate();
  const { t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const { data } = await supabase
    .from("tester_devices")
    .select("id, label, device_id, fingerprint_board, fingerprint_disk, fingerprint_machine, pass_hash, enrol_until, via, added_at")
    .is("removed_at", null)
    .order("added_at", { ascending: true });

  const all = data ?? [];
  const now = Date.now();
  const rows: TesterRow[] = all
    .filter((row) => !row.via)
    /* A QR code nobody scanned in time is nothing to remove. */
    .filter((row) => row.pass_hash || !row.enrol_until || new Date(row.enrol_until as string).getTime() > now)
    .map((row) => ({
      id: row.id as string,
      label: (row.label as string) ?? "",
      kind: row.pass_hash
        ? "iphone"
        : row.enrol_until
          ? "pending"
          : row.fingerprint_board && row.fingerprint_disk
            ? "computer"
            : "device",
      installs: all.filter((one) => one.via === row.id).length,
      addedAt: row.added_at as string,
      until: (row.enrol_until as string | null) ?? null,
    }));

  return (
    <>
      <AdminNav current="/admin/appareils-test" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-2xl font-semibold text-foreground">{t.testers.title}</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">{t.testers.intro}</p>
      <TesterDevices rows={rows} words={{ t: t.testers, locale, minutes: ENROL_MINUTES }} />
    </>
  );
}
