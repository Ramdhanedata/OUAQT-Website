import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { SettingRow } from "@/builder/admin/settings-form";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";

/*
 * Every value the system runs on, in one editable list.
 *
 * This page is the reason no price is written into the code. Changing what a
 * licence costs should be somebody typing a number here, not a deploy.
 */
export default async function SettingsPage() {
  const gate = await adminGate();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">No database configured.</p>;

  const { data: settings } = await supabase
    .from("settings")
    .select("key, value, description, updated_at")
    .order("key");

  return (
    <>
      <AdminNav current="/admin/reglages" staff={gate.staff.name ?? "staff"} />
      <h1 className="text-2xl font-semibold text-foreground">Réglages</h1>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        Les valeurs changent ici, jamais dans le code. Un prix vide veut dire
        que la page le dit, plutôt que d&apos;inventer un chiffre.
      </p>

      {/*
        * The way into trades that are not open to owners yet. They are listed
        * in test_packs below; this link lets this browser choose them in the
        * builder for thirty days.
        */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-border p-4">
        <p className="text-base leading-relaxed text-foreground">
          Métiers en test, fermés aux clients : voir <code>test_packs</code> ci-dessous.
        </p>
        <a
          href="/api/admin/test-builder"
          className="inline-flex min-h-[44px] items-center rounded-md bg-foreground px-4 text-base font-medium text-background"
        >
          Tester le créateur
        </a>
        <a
          href="/api/admin/test-builder?off=1"
          className="inline-flex min-h-[44px] items-center text-base text-muted-foreground underline"
        >
          Quitter le mode test
        </a>
      </div>

      <ul className="mt-6 divide-y divide-border">
        {(settings ?? []).map((setting) => (
          <SettingRow
            key={setting.key}
            settingKey={setting.key}
            value={JSON.stringify(setting.value)}
            description={setting.description}
          />
        ))}
      </ul>
    </>
  );
}
