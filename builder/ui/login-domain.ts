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
 * What staff type to sign in to the admin area: an email, or a short name of
 * their own, such as "ouaqtadmin1". A name becomes an address on the same
 * domain, because Supabase signs people in with an address. A name must hold
 * a letter, so it can never be mistaken for an owner's phone number, which
 * becomes an address on this domain the same way.
 */
export const STAFF_NAME = /^(?=.*[a-z])[a-z0-9._-]{3,40}$/;

export function loginAddress(login: string): string {
  const clean = login.trim().toLowerCase();
  return clean.includes("@") ? clean : `${clean}@${PHONE_DOMAIN}`;
}
