/*
 * The phone number becomes a login address, because Supabase signs people in
 * with one and phone sign-in would mean paying for an SMS on every account.
 * The owner never sees it and never types it.
 *
 * The domain has to exist in DNS or Supabase refuses the address outright,
 * which rules out ouaqt.com until it is pointed somewhere. It is a variable
 * so it can be changed before real owners exist. Changing it afterwards locks
 * every one of them out, so it belongs in the launch checklist.
 *
 * Its own file so the admin area can tell such an address from a real one:
 * the step that uses it is a client component, and a server page cannot read
 * a value out of one.
 */
export const PHONE_DOMAIN =
  process.env.NEXT_PUBLIC_ACCOUNT_EMAIL_DOMAIN?.trim() || "ouaqtcom.vercel.app";

/*
 * What staff type to sign in to the admin area: an email, or a username of
 * their own, written however they like: "Adel Ramdhane", "Adel_Ramdhane 1",
 * "عادل". Supabase signs people in with an address, so a username becomes
 * one on the same domain, and the same name always becomes the same address,
 * whatever its capitals or spacing.
 *
 *   - A plain name of letters, digits, dots, dashes or underscores, with a
 *     letter in it, is the address as it is: "ouaqtadmin1@…". The first
 *     staff accounts were made that way and still sign in.
 *   - Anything else, spaces, Arabic, punctuation, only digits, becomes
 *     "staff-<a fingerprint of the name>@…". The name itself is kept on the
 *     account to be shown on the Team page.
 *
 * Neither can ever be an owner's address, which is his phone's digits alone.
 */
export const STAFF_NAME = /^(?=.*[a-z])[a-z0-9._-]{3,40}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The name as staff typed it, tidied: what is shown, and what the address is made from. */
export function cleanStaffLogin(login: string): string {
  return login.normalize("NFC").trim().replace(/\s+/g, " ");
}

export async function loginAddress(login: string): Promise<string | null> {
  const clean = cleanStaffLogin(login);
  if (!clean) return null;
  const lower = clean.toLowerCase();
  if (EMAIL.test(lower)) return lower;
  if (STAFF_NAME.test(lower)) return `${lower}@${PHONE_DOMAIN}`;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(lower)));
  const hex = Array.from(digest.slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `staff-${hex}@${PHONE_DOMAIN}`;
}
