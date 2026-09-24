import "server-only";

/*
 * ─────────────────────────────────────────────────────────────────────────
 *  NOT CONNECTED YET. Nothing is sent from here.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Sending the owner his numéro de série on WhatsApp, to the phone number he
 * gave during the questions. Two callers:
 *
 *   - the moment the questions end, without asking him, because owners
 *     screenshot things and lose them;
 *   - "Vous avez perdu votre numéro ?", which sends it again to that phone
 *     and never shows it on screen from a phone number alone.
 *
 * Until a WhatsApp Business sender is set up, this answers { sent: false }
 * and says why, and every caller behaves honestly: the issue screen does not
 * claim a message went out, and a re-send request is queued for staff in the
 * admin area (Demandes) to send by hand.
 *
 * The phone arrives as its last eight digits, the way numbers are matched
 * (see phoneKey in builder/config-code/code.ts): a Mauritanian number, to be
 * sent to with 222 in front.
 *
 * To connect it: send the message below through the provider, return
 * { sent: true } on success, and { sent: false, reason } on any failure. The
 * callers need no other change. The message must not carry anything but the
 * number and what it is for.
 */

export type SendResult = { sent: true } | { sent: false; reason: "not_connected" | "no_phone" | "failed" };

/* Also the text staff send by hand from Demandes, so both say the same thing. */
export const MESSAGE: Record<"fr" | "ar" | "en", (serial: string) => string> = {
  fr: (serial) => `OUAQT. Votre numéro de série : ${serial}. Sur l'ordinateur du commerce, tapez-le sur le site OUAQT pour télécharger votre logiciel.`,
  ar: (serial) => `OUAQT. رقمك التسلسلي: ${serial}. على حاسوب المحل، اكتبه في موقع OUAQT لتنزيل برنامجك.`,
  en: (serial) => `OUAQT. Your serial number: ${serial}. On the shop computer, type it on the OUAQT website to download your software.`,
};

export async function sendNumber(input: {
  phone: string | null;
  serial: string;
  language: "fr" | "ar" | "en";
}): Promise<SendResult> {
  if (!input.phone) return { sent: false, reason: "no_phone" };
  void MESSAGE[input.language](input.serial);
  return { sent: false, reason: "not_connected" };
}
