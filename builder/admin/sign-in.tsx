import { adminWords } from "./language";
import { SignInForm } from "./sign-in-form";

/*
 * The sign-in screen, in the language this browser chose. The form itself is
 * a client component; this reads the language on the server and hands it the
 * words, so every page that shows the sign-in keeps calling it the same way.
 */
export async function AdminSignIn({
  reason,
}: {
  reason: "signed_out" | "needs_second_factor" | "not_staff";
}) {
  const { t } = await adminWords();
  return <SignInForm reason={reason} t={t.signIn} brand={t.brand} />;
}
