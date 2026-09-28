import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { adminWords } from "@/builder/admin/language";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";
import { statusOf, type LicencePlan } from "@/builder/licence/status";
import { hashSerial, isSerial } from "@/builder/serial/serial";
import { wordFor } from "@/builder/admin/copy";

/*
 * Finding one client, by whatever the person on the phone has in front of
 * them: a shop name, or a serial read out loud.
 *
 * A serial is searched by its hash, because the table holds no serial in the
 * clear. That is not an obstacle to look around: it is the same lookup the
 * desktop app will do when it activates.
 */
export default async function ClientsPage(
  props: {
    searchParams: Promise<{ q?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const gate = await adminGate();
  const { t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const query = (searchParams.q ?? "").trim();
  const settings = await getPublicSettings();
  const rules = { renewalGraceDays: settings?.renewal_grace_days ?? 0 };

  let businessIds: string[] | null = null;
  if (query && isSerial(query)) {
    const { data } = await supabase
      .from("serials")
      .select("business_id")
      .eq("serial_hash", await hashSerial(query));
    businessIds = data?.map((row) => row.business_id) ?? [];
  }

  let request = supabase
    .from("businesses")
    .select("id, name_latin, name_arabic, pack, launch_client, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (businessIds) {
    request = request.in("id", businessIds.length ? businessIds : ["none"]);
  } else if (query) {
    request = request.ilike("name_latin", `%${query}%`);
  }

  const { data: businesses } = await request;
  const ids = (businesses ?? []).map((one) => one.id);

  const { data: licences } = ids.length
    ? await supabase
        .from("licences")
        .select("business_id, plan, status, starts_at, ends_at")
        .in("business_id", ids)
    : { data: [] };

  const byBusiness = new Map((licences ?? []).map((one) => [one.business_id, one]));
  const now = new Date();

  return (
    <>
      <AdminNav current="/admin/clients" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-2xl font-semibold text-foreground">{t.clients.title}</h1>

      <form method="get" className="mt-4 flex gap-3">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder={t.clients.search}
          className="min-h-[48px] flex-1 rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
        />
        <button
          type="submit"
          className="min-h-[48px] rounded-lg border border-border px-5 text-base text-foreground"
        >
          {t.clients.searchButton}
        </button>
      </form>

      {(businesses ?? []).length === 0 ? (
        <p className="mt-6 text-base text-muted-foreground">
          {query ? t.clients.nothingFound : t.clients.none}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {(businesses ?? []).map((business) => {
            const licence = byBusiness.get(business.id);
            const status = licence
              ? statusOf(
                  {
                    plan: licence.plan as LicencePlan,
                    startsAt: licence.starts_at ? new Date(licence.starts_at) : null,
                    endsAt: licence.ends_at ? new Date(licence.ends_at) : null,
                    suspended: licence.status === "suspended",
                  },
                  now,
                  rules
                )
              : null;

            return (
              <li key={business.id} className="flex flex-wrap justify-between gap-3 py-3">
                <span className="text-base text-foreground">
                  {business.name_latin}
                  <span className="text-muted-foreground">
                    {" "}
                    · {wordFor(t.packs, business.pack)}
                    {business.launch_client ? ` · ${t.clients.launch}` : ""}
                  </span>
                </span>
                <span className="text-base text-muted-foreground">
                  {status ? wordFor(t.statuses, status) : t.clients.noLicence}
                  {licence?.ends_at
                    ? ` · ${new Date(licence.ends_at).toLocaleDateString(locale)}`
                    : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
