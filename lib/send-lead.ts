import { parseContact } from "@/lib/contact-channel";
import { sendViaFormSubmit } from "@/lib/formsubmit";

/*
 * "My business is not on this list" and "tell me when my trade opens", from
 * the browser. The server keeps the answer and mails it to OUAQT; when it
 * could not mail (no key set yet), the browser mails it through FormSubmit,
 * so the phone number always reaches the inbox. True once it is either kept
 * or mailed.
 */
export async function sendLead(lead: {
  phone: string;
  businessType?: string;
  pack?: string;
}): Promise<boolean> {
  const page = window.location.pathname;
  const locale = document.documentElement.lang || "fr";

  let kept = false;
  try {
    const response = await fetch("/api/builder/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...lead, page, locale }),
    });
    // Refused (bad number, too many tries): the browser does not go round it.
    if (response.status === 400 || response.status === 429) return false;
    const answer = (await response.json().catch(() => null)) as { mailed?: boolean } | null;
    if (answer?.mailed) return true;
    kept = response.ok;
  } catch {
    // The route could not be reached at all; the mail below still can.
  }

  const business = lead.pack
    ? [lead.pack, lead.businessType].filter(Boolean).join(": ")
    : (lead.businessType ?? "").trim();
  const channel = parseContact(lead.phone);
  const mailed = await sendViaFormSubmit({
    _subject: lead.pack
      ? `OUAQT: waiting for a trade that is not open yet (${business})`
      : `OUAQT: business not on the list (${business})`,
    [lead.pack ? "Trade" : "Business"]: business,
    "Phone / WhatsApp": lead.phone.trim(),
    ...(channel?.kind === "phone" && channel.whatsappUrl ? { "Open in WhatsApp": channel.whatsappUrl } : {}),
    Page: page,
    Language: locale,
  });
  return mailed || kept;
}
