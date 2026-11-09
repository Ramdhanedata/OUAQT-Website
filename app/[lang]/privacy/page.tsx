import { pageMetadata } from "@/lib/seo/page-metadata";
import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary } from "@/lib/i18n";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbData } from "@/lib/seo/breadcrumbs";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { alternatesFor } from "@/lib/i18n/metadata";
import type { Metadata } from "next";

type Props = { params: Promise<{ lang: Locale }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  return pageMetadata(params.lang, dict, {
    title: dict.meta.privacyTitle,
    description: dict.meta.privacyDescription,
    alternates: alternatesFor(params.lang, "/privacy"),
  });
}

export default async function PrivacyPage(props: Props) {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  const p = dict.legal.privacy;

  return (
    <>
    <JsonLd data={breadcrumbData(params.lang, dict, [{ name: dict.footer.privacy, path: localeHref(params.lang, "/privacy") }])} />
    <LegalPage
      title={p.title}
      intro={p.intro}
      updatedLabel={dict.legal.updated}
      updatedDate={dict.legal.updatedDate}
      sections={[
        p.collect,
        p.builder,
        p.neverReceived,
        p.ai,
        p.payments,
        p.fingerprint,
        p.where,
        p.sharing,
        p.retention,
        p.clientSystems,
        p.rights,
        p.contact,
      ]}
    />
    </>
  );
}
