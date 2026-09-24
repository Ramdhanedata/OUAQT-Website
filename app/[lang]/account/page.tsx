import type { Metadata } from "next";
import { mayReadImages } from "@/builder/ai";
import { getBuilderCopy } from "@/builder/copy";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { sessionClient } from "@/builder/db/server";
import { getPublicSettings, installersFor } from "@/builder/db/settings";
import { statusOf, graceDaysLeft, daysLeft, type LicencePlan } from "@/builder/licence/status";
import { priceFor } from "@/builder/payment/pricing";
import { decryptSerial } from "@/builder/serial/cipher";
import { AccountArea } from "@/builder/ui/account";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";

type Props = { params: { lang: Locale } };

/*
 * Never prerendered and never cached. This page is one owner's business,
 * read from his own session, and a cached copy of it is a copy of his serial
 * number sitting where the next visitor can be handed it.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: Props): Metadata {
  const copy = getBuilderCopy(params.lang);
  const dict = getDictionary(params.lang);
  return {
    title: `${copy.myAccount.title} | ${dict.common.brand}`,
    // Nobody should find their way here from a search result.
    robots: { index: false, follow: false },
    alternates: { canonical: localisedHref(params.lang, "account") },
  };
}

/*
 * The owner's own page.
 *
 * Everything is read as him, through row level security, so this page cannot
 * show one owner another's business even if the query were wrong. The serial
 * is decrypted here, on the server, and the key never reaches the browser.
 */
export default async function AccountPage({ params }: Props) {
  const copy = getBuilderCopy(params.lang);
  const supabase = sessionClient();

  if (!supabase) {
    return <AccountArea copy={copy} lang={params.lang} state={{ kind: "signed_out" }} />;
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.is_anonymous) {
    return <AccountArea copy={copy} lang={params.lang} state={{ kind: "signed_out" }} />;
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name_latin, pack, launch_client")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) {
    return <AccountArea copy={copy} lang={params.lang} state={{ kind: "no_business" }} />;
  }

  const { data: serialRow } = await supabase
    .from("serials")
    .select("serial_cipher")
    .eq("business_id", business.id)
    .maybeSingle();

  const { data: requests } = await supabase
    .from("feature_requests")
    .select("text, status, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const [{ data: licenceRow }, { data: lastPayment }, { data: deviceRows }, settings, secrets] =
    await Promise.all([
      supabase
        .from("licences")
        .select("plan, status, starts_at, ends_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("status, created_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("devices")
        .select("device_id, name, role, status, last_seen")
        .eq("business_id", business.id)
        .eq("status", "active")
        .order("first_seen"),
      getPublicSettings(),
      getPrivateSettings(),
    ]);

  /*
   * The licence state is worked out from its dates here, not read from the
   * status column: a column nobody has touched since last year says whatever
   * it said last year.
   */
  const licence = licenceRow
    ? {
        plan: licenceRow.plan as LicencePlan,
        startsAt: licenceRow.starts_at ? new Date(licenceRow.starts_at) : null,
        endsAt: licenceRow.ends_at ? new Date(licenceRow.ends_at) : null,
        suspended: licenceRow.status === "suspended",
      }
    : null;

  const now = new Date();
  const rules = { renewalGraceDays: settings?.renewal_grace_days ?? 0 };
  const status = licence ? statusOf(licence, now, rules) : null;

  return (
    <AccountArea
      copy={copy}
      lang={params.lang}
      state={{
        kind: "signed_in",
        businessName: business.name_latin,
        pack: business.pack,
        serial: serialRow?.serial_cipher
          ? await decryptSerial(serialRow.serial_cipher)
          : null,
        requests: (requests ?? []).map((one) => ({
          text: one.text,
          status: one.status,
        })),
        licence:
          licence && status
            ? {
                status,
                endsAt: licence.endsAt ? licence.endsAt.toISOString() : null,
                daysLeft: daysLeft(licence, now),
                graceDaysLeft: graceDaysLeft(licence, now, rules),
              }
            : null,
        lastPaymentStatus: lastPayment?.status ?? null,
        devices: (deviceRows ?? []).map((device) => ({
          deviceId: device.device_id,
          name: device.name,
          role: device.role === "main" ? ("main" as const) : ("secondary" as const),
          lastSeen: device.last_seen,
        })),
        price: settings
          ? priceFor("annual", settings, business.launch_client)
          : null,
        bankilyNumber: secrets?.bankily_number || null,
        aiReadsImages: mayReadImages(),
        installers: installersFor(settings, business.pack),
      }}
    />
  );
}
