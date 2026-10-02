import type { LicenceStatus } from "@/app-ui/licence-status";

/*
 * Where each shop stands on the Contrôle page, in the words staff decide by:
 * a trial running or over, paid, given for life, due for renewal, expired,
 * suspended, banned, or no licence at all. A ban outranks everything; a
 * suspension outranks the dates; a lifetime gift is told apart from a
 * lifetime licence that was paid for.
 */

export const CONTROL_GROUPS = ["trial", "trial_over", "paid", "lifetime", "renewal", "expired", "suspended", "banned", "none"] as const;
export type ControlGroup = (typeof CONTROL_GROUPS)[number];

export function controlGroupOf(input: { banned: boolean; status: LicenceStatus | null; plan: string | null; gift: boolean }): ControlGroup {
  if (input.banned) return "banned";
  if (!input.status) return "none";
  if (input.status === "suspended") return "suspended";
  if (input.gift && input.plan === "perpetual") return "lifetime";
  switch (input.status) {
    case "trial":
      return "trial";
    case "expired_trial":
      return "trial_over";
    case "renewal_due":
      return "renewal";
    case "expired":
      return "expired";
    default:
      return "paid";
  }
}

export function isControlGroup(value: string | undefined): value is ControlGroup {
  return (CONTROL_GROUPS as readonly string[]).includes(value ?? "");
}

/* Whole days until the end, never negative; null when there is no end. */
export function daysUntil(endsAt: string | null, now: Date): number | null {
  if (!endsAt) return null;
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 86_400_000));
}

/*
 * What a shop can be asked to do from where it stands. The page shows these
 * buttons and only these, so a click never meets a refusal it could have
 * been spared.
 */
export type ControlAction = "gift" | "grant" | "extend" | "stop_trial" | "cancel" | "suspend" | "reactivate" | "ban" | "unban";

export function actionsFor(input: { group: ControlGroup; plan: string | null }): ControlAction[] {
  if (input.group === "banned") return ["unban"];
  const out: ControlAction[] = [];
  if (input.group !== "lifetime") out.push("gift");
  out.push("grant");
  if (input.plan !== "perpetual" && input.group !== "none") out.push("extend");
  if (input.group === "trial") out.push("stop_trial");
  if (input.group === "paid" || input.group === "lifetime" || input.group === "renewal") out.push("cancel");
  if (input.group === "suspended") out.push("reactivate");
  else if (input.group !== "none") out.push("suspend");
  out.push("ban");
  return out;
}
