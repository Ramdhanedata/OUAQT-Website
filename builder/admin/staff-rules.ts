import { PHONE_DOMAIN, STAFF_NAME } from "@/builder/ui/login-domain";

/*
 * Who may be staff, and with what password: the rules the Team page and
 * scripts/make-admin.mjs both apply.
 *
 * A login is an email or a short name such as "ouaqtadmin1"; a name becomes
 * an address on the domain owners' phone logins use, which is what the
 * sign-in page turns it into as well.
 */

export type StaffLogin = { email: string; shown: string };

export function staffLogin(login: string): StaffLogin | null {
  const clean = login.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { email: clean, shown: clean };
  if (STAFF_NAME.test(clean)) return { email: `${clean}@${PHONE_DOMAIN}`, shown: clean };
  return null;
}

/** What an address looks like on the Team page: the name, when it is one of ours. */
export function shownLogin(email: string | null | undefined): string {
  if (!email) return "";
  const suffix = `@${PHONE_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}

/*
 * Twelve characters, and not only digits or one character repeated. The
 * admin page is reachable by anyone on the internet, and "12345678" is the
 * first thing a stranger tries on it.
 */
export type PasswordProblem = "too_short" | "only_digits" | "one_character";

export function passwordProblem(password: string): PasswordProblem | null {
  if (password.length < 12) return "too_short";
  if (/^\d+$/.test(password)) return "only_digits";
  if (/^(.)\1+$/.test(password)) return "one_character";
  return null;
}
