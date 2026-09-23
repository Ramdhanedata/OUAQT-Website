import "server-only";

/*
 * ─────────────────────────────────────────────────────────────────────────
 *  NOT CONNECTED YET. Nothing is sent from here.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Sending the code de configuration to the owner on WhatsApp, to the number
 * he gave during the questions. Two callers:
 *
 *   - the moment the code is issued, without asking him, because owners
 *     screenshot things and lose them;
 *   - "Vous avez perdu votre code ?", which sends it again to that number and
 *     never shows it on screen from a phone number alone.
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
 * code and what it is for.
 */

export type SendResult = { sent: true } | { sent: false; reason: "not_connected" | "no_phone" | "failed" };

/* Also the text staff send by hand from Demandes, so both say the same thing. */
export const MESSAGE: Record<"fr" | "ar" | "en", (code: string) => string> = {
  fr: (code) => `OUAQT. Votre code de configuration : ${code}. Il récupère votre configuration sur un ordinateur.`,
  ar: (code) => `OUAQT. رمز الإعداد الخاص بك: ${code}. يسترجع إعدادك على حاسوب.`,
  en: (code) => `OUAQT. Your configuration code: ${code}. It brings your configuration back on a computer.`,
};

export async function sendConfigurationCode(input: {
  phone: string | null;
  code: string;
  language: "fr" | "ar" | "en";
}): Promise<SendResult> {
  if (!input.phone) return { sent: false, reason: "no_phone" };
  void MESSAGE[input.language](input.code);
  return { sent: false, reason: "not_connected" };
}
