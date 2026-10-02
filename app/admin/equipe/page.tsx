import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { AdminNav } from "@/builder/admin/nav";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { StaffActions, StaffForm } from "@/builder/admin/staff-form";
import { shownLogin } from "@/builder/admin/staff-rules";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * The team: who can open the admin area, and the form that adds someone or
 * gives them a new password. It does in a page what scripts/make-admin.mjs
 * does in a terminal, so nobody has to type a password into a prompt that
 * shows nothing.
 */
export default async function TeamPage() {
  const gate = await adminGate();
  const { t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const { data: rows } = await supabase.from("admin_users").select("user_id, name, created_at").order("created_at");
  const members = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data } = await supabase.auth.admin.getUserById(row.user_id);
      const factors = (data?.user?.factors ?? []).filter((factor) => factor.status === "verified");
      return {
        userId: row.user_id as string,
        name: (row.name as string | null) ?? null,
        login: shownLogin(data?.user?.email, data?.user?.user_metadata?.login),
        since: row.created_at as string,
        ready: factors.length > 0,
      };
    })
  );

  const s = t.staff;

  return (
    <>
      <AdminNav current="/admin/equipe" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">{s.intro}</p>

      <ul className="mt-6 divide-y divide-border">
        {members.map((member) => (
          <li key={member.userId} className="py-4">
            <p className="text-base text-foreground">
              <span className="font-medium">{member.name ?? member.login}</span>
              {member.userId === gate.staff.id ? <span className="text-muted-foreground"> · {s.you}</span> : null}
            </p>
            <p className="text-base text-muted-foreground">
              <bdi dir="ltr">{member.login}</bdi>
              {" · "}
              {member.ready ? s.factorReady : s.factorMissing}
              {" · "}
              {fill(s.since, { date: new Date(member.since).toLocaleDateString(locale) })}
            </p>
            <StaffActions t={s} userId={member.userId} login={member.login} isYou={member.userId === gate.staff.id} />
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <StaffForm t={s} />
      </div>
    </>
  );
}
