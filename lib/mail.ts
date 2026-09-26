/*
 * Mail to OUAQT's own inbox, from the server.
 *
 * Sends through Resend's REST API directly, so there is no SDK dependency to
 * keep updated. The contact form and the "my business is not on this list"
 * form both use it.
 *
 * Environment variables (set these in Vercel, and in .env.local for local
 * testing):
 *   RESEND_API_KEY      from resend.com/api-keys
 *   CONTACT_TO_EMAIL    defaults to ouaqt.mrt@gmail.com
 *   CONTACT_FROM_EMAIL  optional. Until a domain is verified with Resend this
 *                       must stay on their shared sender, onboarding@resend.dev.
 *
 * With no verified domain, Resend only delivers to the address that owns the
 * account. Sign up with ouaqt.mrt@gmail.com and delivery works. Verifying a
 * domain later lifts that and lets mail come from, say, hello@ouaqt.com.
 *
 * With no key at all, the routes say so and the browser sends through
 * FormSubmit instead (lib/formsubmit.ts), so nothing is lost either way.
 */

const TO = process.env.CONTACT_TO_EMAIL || "ouaqt.mrt@gmail.com";
const FROM = process.env.CONTACT_FROM_EMAIL || "OUAQT Website <onboarding@resend.dev>";

export type MailResult = "sent" | "no_mailer" | "failed";

export async function mailOuaqt(mail: {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return "no_mailer";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    if (!response.ok) {
      console.error("Resend rejected the message:", response.status, await response.text());
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("Could not reach Resend:", error);
    return "failed";
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* One "Label: value" line of the email, in the same small type throughout. */
export function mailLine(label: string, value: string) {
  return `<p style="font:14px system-ui;margin:0 0 6px"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}
