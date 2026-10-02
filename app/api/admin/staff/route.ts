import { NextResponse } from "next/server";
import { z } from "zod";
import { adminGate } from "@/builder/admin/guard";
import { passwordProblem, staffLogin } from "@/builder/admin/staff-rules";
import { audit } from "@/builder/db/audit";
import { adminClient } from "@/builder/db/server";

/*
 * Staff managing staff, from the Team page.
 *
 *   save          adds someone, or sets a new password for someone who is
 *                 already there: what scripts/make-admin.mjs does, in a form.
 *   reset_factor  forgets a lost phone's authenticator; the next sign-in
 *                 shows a new QR code.
 *   remove        takes someone off the team. Their login stays, it simply
 *                 no longer opens the admin area. Nobody removes themselves,
 *                 so the team can never lock its last member out.
 *
 * The password is typed by the person in the form and passed straight to
 * Supabase. It is never logged, never written to the trail, never returned.
 *
 * Only staff who signed in reach it, or the developer on their own machine,
 * the one place the admin area opens without a login (see guard.ts).
 */

const body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    login: z.string().trim().min(1).max(200),
    name: z.string().trim().max(80).optional(),
    password: z.string().min(1).max(200),
  }).strict(),
  z.object({ action: z.literal("reset_factor"), userId: z.string().uuid() }).strict(),
  z.object({ action: z.literal("remove"), userId: z.string().uuid() }).strict(),
]);

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  if (input.data.action === "save") {
    const login = await staffLogin(input.data.login);
    if (!login) return NextResponse.json({ error: "bad_login" }, { status: 400 });
    const problem = passwordProblem(input.data.password);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    /* The admin API lists accounts, it does not search them. */
    let userId: string | null = null;
    for (let page = 1; page < 50 && !userId; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
      userId = data.users.find((user) => user.email?.toLowerCase() === login.email)?.id ?? null;
      if (data.users.length < 200) break;
    }

    const existed = Boolean(userId);
    if (userId) {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: input.data.password,
        user_metadata: { login: login.shown },
      });
      if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: login.email,
        password: input.data.password,
        email_confirm: true,
        /* The name as it was typed, for the Team page: the address may be a fingerprint of it. */
        user_metadata: { login: login.shown },
      });
      if (error || !data.user) return NextResponse.json({ error: "not_saved" }, { status: 502 });
      userId = data.user.id;
    }

    const name = input.data.name?.trim() || null;
    const { error: staffError } = await supabase
      .from("admin_users")
      .upsert({ user_id: userId, ...(name ? { name } : {}) }, { onConflict: "user_id" });
    if (staffError) return NextResponse.json({ error: "not_saved" }, { status: 502 });

    await audit({
      actorId: gate.staff.id,
      subject: "staff",
      subjectId: userId,
      action: existed ? "staff_password_set" : "staff_added",
      detail: { login: login.shown },
    });
    return NextResponse.json({ ok: true, login: login.shown, existed });
  }

  const { userId } = input.data;
  const { data: member } = await supabase.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "not_staff" }, { status: 404 });

  if (input.data.action === "remove") {
    if (userId === gate.staff.id) return NextResponse.json({ error: "yourself" }, { status: 409 });
    const { error } = await supabase.from("admin_users").delete().eq("user_id", userId);
    if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
    await audit({ actorId: gate.staff.id, subject: "staff", subjectId: userId, action: "staff_removed" });
    return NextResponse.json({ ok: true });
  }

  const { data: factors, error } = await supabase.auth.admin.mfa.listFactors({ userId });
  if (error) return NextResponse.json({ error: "not_saved" }, { status: 502 });
  for (const factor of factors?.factors ?? []) {
    const { error: deleteError } = await supabase.auth.admin.mfa.deleteFactor({ userId, id: factor.id });
    if (deleteError) return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }
  await audit({ actorId: gate.staff.id, subject: "staff", subjectId: userId, action: "staff_factor_reset" });
  return NextResponse.json({ ok: true });
}
