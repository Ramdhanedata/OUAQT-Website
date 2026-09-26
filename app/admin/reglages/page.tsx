import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { adminWords } from "@/builder/admin/language";
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
  const { t } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const { data: settings } = await supabase
    .from("settings")
    .select("key, value, description, updated_at")
    .order("key");

  return (
    <>
      <AdminNav current="/admin/reglages" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-2xl font-semibold text-foreground">{t.settings.title}</h1>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        {t.settings.intro}
      </p>

      {/*
        * The way into trades that are not open to owners yet (which ones:
        * builder/packs/opening.ts). This link lets this browser choose them
        * in the builder for thirty days.
        */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-border p-4">
        <p className="text-base leading-relaxed text-foreground">
          {t.settings.testPacks}
        </p>
        {/* A request that sets a cookie and redirects, not a page: a full navigation on purpose. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/test-builder"
          className="inline-flex min-h-[44px] items-center rounded-md bg-foreground px-4 text-base font-medium text-background"
        >
          {t.settings.testBuilder}
        </a>
        {/* A request that sets a cookie and redirects, not a page: a full navigation on purpose. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/test-builder?off=1"
          className="inline-flex min-h-[44px] items-center text-base text-muted-foreground underline"
        >
          {t.settings.leaveTest}
        </a>
      </div>

      <ul className="mt-6 divide-y divide-border">
        {(settings ?? []).map((setting) => (
          <SettingRow
            key={setting.key}
            settingKey={setting.key}
            value={JSON.stringify(setting.value)}
            description={setting.description}
            t={t.settings}
          />
        ))}
      </ul>
    </>
  );
}
