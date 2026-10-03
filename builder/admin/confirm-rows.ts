import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSettings } from "@/builder/db/settings";
import { licenceChoices } from "@/builder/payment/pricing";
import type { PaymentRow } from "./payments";

/*
 * Payments as the cards that decide them want them: the shop, what was
 * expected and what arrived, a short-lived link to the screenshot, and the
 * lengths a person may grant. Used by the list of payments to handle and by
 * one payment's own page, so both decide the same way.
 */

export const CONFIRM_COLUMNS = "id, business_id, plan, app, expected_amount, reference, extracted, status, screenshot_path, created_at";

type Raw = {
  id: string;
  business_id: string;
  plan: string;
  app: PaymentRow["app"];
  expected_amount: number | string;
  reference: string | null;
  extracted: PaymentRow["extracted"];
  status: string;
  screenshot_path: string;
  created_at: string;
};

/*
 * A link that works for a few minutes and then stops. The bucket is private
 * and nothing here hands out a permanent address to somebody's receipt.
 */
const MINUTES = 10 * 60; // not-a-rule: how long a signed link lives

export async function signedScreenshot(supabase: SupabaseClient, path: string): Promise<string | null> {
  const signed = await supabase.storage.from("payments").createSignedUrl(path, MINUTES);
  return signed.data?.signedUrl ?? null;
}

export async function confirmRowsFor(supabase: SupabaseClient, payments: Raw[]): Promise<PaymentRow[]> {
  const businessIds = Array.from(new Set(payments.map((payment) => payment.business_id)));
  const { data: businesses } = businessIds.length
    ? await supabase.from("businesses").select("id, name_latin, pack, launch_client").in("id", businessIds)
    : { data: [] };
  const byId = new Map((businesses ?? []).map((one) => [one.id, one]));
  const settings = await getPublicSettings();

  return Promise.all(
    payments.map(async (payment) => {
      const business = byId.get(payment.business_id);
      return {
        id: payment.id,
        businessName: business?.name_latin ?? "",
        pack: business?.pack ?? "",
        launchClient: Boolean(business?.launch_client),
        plan: payment.plan,
        /*
         * A year or six months, at this shop's prices: the length a person
         * grants is the one the amount on the image paid for.
         */
        choices:
          settings && (payment.plan === "annual" || payment.plan === "semiannual")
            ? licenceChoices(settings, Boolean(business?.launch_client)).map((one) => ({ plan: one.plan, amount: one.amount as number }))
            : [],
        app: payment.app,
        expected: Number(payment.expected_amount),
        reference: payment.reference,
        extracted: payment.extracted ?? null,
        status: payment.status,
        receivedAt: payment.created_at,
        screenshotUrl: await signedScreenshot(supabase, payment.screenshot_path),
      };
    })
  );
}
