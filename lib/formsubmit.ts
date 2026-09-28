import { organization } from "@/lib/data/contact";

/*
 * Sends a form to OUAQT's inbox through FormSubmit, straight from the
 * visitor's browser. This is the path when the server has no mailer: the
 * same request from Vercel's servers is refused, so it runs client side,
 * which is how FormSubmit is meant to be used.
 *
 * Activation is tied to the page address FormSubmit sees, and the inbox was
 * activated for /en/contact. The referrer is set to that page on the current
 * host so every page and every language uses the same activation.
 */
export async function sendViaFormSubmit(fields: Record<string, string>): Promise<boolean> {
  try {
    const response = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(organization.email)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        referrer: `${window.location.origin}/en/contact`,
        referrerPolicy: "no-referrer-when-downgrade",
        body: JSON.stringify({ _template: "table", _captcha: "false", ...fields }),
      }
    );
    // FormSubmit answers 200 even when it refuses; the body says which.
    const data = (await response.json().catch(() => null)) as { success?: string | boolean } | null;
    return response.ok && String(data?.success) === "true";
  } catch {
    return false;
  }
}
