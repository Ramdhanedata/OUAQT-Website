import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { RenewalForm } from "@/builder/admin/renewal-form";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";

export default async function RenewalCodesPage() {
  const gate = await adminGate();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">No database configured.</p>;

  const [{ data: businesses }, { data: recent }] = await Promise.all([
    supabase.from("businesses").select("id, name_latin").order("name_latin").limit(200),
    supabase
      .from("renewal_codes")
      .select("device_code, new_ends_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      <AdminNav current="/admin/codes" staff={gate.staff.name ?? "staff"} />
      <h1 className="text-2xl font-semibold text-foreground">
        Codes de renouvellement
      </h1>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        Le propriétaire lit le code affiché par son logiciel. Vous lui lisez
        celui-ci. Il le tape sans internet et son logiciel repart.
      </p>

      <RenewalForm
        businesses={(businesses ?? []).map((one) => ({ id: one.id, name: one.name_latin }))}
      />

      {(recent ?? []).length > 0 ? (
        <section className="mt-12">
          <h2 className="text-base font-medium text-foreground">Derniers codes</h2>
          <ul className="mt-2 divide-y divide-border">
            {(recent ?? []).map((one, index) => (
              <li key={index} className="flex justify-between py-2 text-base">
                <span className="font-mono text-foreground">
                  <bdi dir="ltr">{one.device_code}</bdi>
                </span>
                <span className="text-muted-foreground">
                  jusqu&apos;au {new Date(one.new_ends_at).toLocaleDateString("fr")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
