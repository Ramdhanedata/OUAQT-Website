import { cleanStaffLogin, loginAddress, PHONE_DOMAIN } from "@/builder/ui/login-domain";

/*
 * Who may be staff, and with what password: the rules the Team page and
 * scripts/make-admin.mjs both apply.
 *
 * A login is an email or any username at all; login-domain.ts says how a
 * name becomes an address, which the sign-in page does the same way.
 */

export type StaffLogin = { email: string; shown: string };

const LOGIN_MAX = 100; // not-a-rule: a name, not a paragraph

export async function staffLogin(login: string): Promise<StaffLogin | null> {
  const shown = cleanStaffLogin(login);
  if (!shown || shown.length > LOGIN_MAX) return null;
  const email = await loginAddress(shown);
  return email ? { email, shown } : null;
}

/*
 * What a staff account is called on the Team page: the name as it was typed
 * when it was made, kept on the account, or the address's own name part for
 * an account made before names were kept.
 */
export function shownLogin(email: string | null | undefined, typed?: unknown): string {
  if (typeof typed === "string" && typed.trim()) return typed;
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
