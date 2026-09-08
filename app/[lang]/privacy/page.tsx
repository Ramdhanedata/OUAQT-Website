import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { alternatesFor } from "@/lib/i18n/metadata";
import type { Metadata } from "next";

type Props = { params: { lang: Locale } };

export function generateMetadata({ params }: Props): Metadata {
  const dict = getDictionary(params.lang);
  return {
    title: dict.meta.privacyTitle,
    description: dict.meta.privacyDescription,
    alternates: alternatesFor(params.lang, "/privacy"),
  };
}

export default function PrivacyPage({ params }: Props) {
  const dict = getDictionary(params.lang);
  const p = dict.legal.privacy;

  return (
    <LegalPage
      title={p.title}
      intro={p.intro}
      updatedLabel={dict.legal.updated}
      updatedDate={dict.legal.updatedDate}
      sections={[
        p.collect,
        p.why,
        p.sharing,
        p.retention,
        p.clientSystems,
        p.rights,
        p.contact,
      ]}
    />
  );
}
