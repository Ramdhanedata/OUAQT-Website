import type { Metadata } from "next";
import { getBuilderCopy } from "@/builder/copy";
import { sessionClient } from "@/builder/db/server";
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
    .select("id, name_latin, pack")
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
        installers: {
          windows: process.env.INSTALLER_URL_WINDOWS || null,
          mac: process.env.INSTALLER_URL_MAC || null,
        },
      }}
    />
  );
}
