import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { getBuilderCopy } from "@/builder/copy";
import { PayBySerial } from "@/builder/ui/pay-by-serial";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";

type Props = { params: Promise<{ lang: Locale }> };

/* Never cached: what it shows depends on the number typed, and on nothing else. */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const copy = getBuilderCopy(params.lang);
  const dict = getDictionary(params.lang);
  return {
    title: `${copy.payBySerial.title} | ${dict.common.brand}`,
    robots: { index: false, follow: false },
    alternates: { canonical: localisedHref(params.lang, "pay") },
  };
}

/*
 * Paying with the numéro de série, for an owner who built his software from
 * the phone and never made an account. See builder/ui/pay-by-serial.tsx.
 */
export default async function PayPage(props: Props) {
  const params = await props.params;
  const copy = getBuilderCopy(params.lang);
  return (
    <section className="py-12 sm:py-16" lang={params.lang}>
      <Container className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{copy.payBySerial.heading}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{copy.payBySerial.intro}</p>
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <PayBySerial copy={copy} lang={params.lang} />
        </div>
      </Container>
    </section>
  );
}
