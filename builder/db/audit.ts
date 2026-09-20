import "server-only";

import { adminClient } from "./server";

/*
 * The trail.
 *
 * Every change to a payment's status writes one of these, with who did it and
 * why. Money is the one place where "the system did it" is not an acceptable
 * answer to an owner asking what happened, and where our own memory of a
 * decision is worth less than a row with a timestamp on it.
 *
 * Nothing reads these from a browser. They are written here and read in the
 * admin area through server code.
 */

export type AuditSubject = "payment" | "licence" | "device" | "settings" | "business";

export async function audit(entry: {
  actorId: string | null;
  subject: AuditSubject;
  subjectId: string;
  action: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const supabase = adminClient();
  if (!supabase) return;

  const { error } = await supabase.from("audit_events").insert({
    actor_id: entry.actorId,
    subject: entry.subject,
    subject_id: entry.subjectId,
    action: entry.action,
    detail: entry.detail ?? null,
  });

  if (error) {
    // A lost trail entry must not swallow the action it was recording, but it
    // must not pass unnoticed either.
    console.error("audit: not written", entry.subject, entry.action, error);
  }
}
