import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { growthCopy } from "@/builder/admin/copy-growth";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { PrintButton } from "@/builder/admin/rep-forms";
import { repDetail, repQrSvg } from "@/builder/admin/reps";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";
import { fill } from "@/lib/utils";

/*
 * A representative's card, to print and hand to shop owners: OUAQT, one line
 * in French and one in Arabic, the QR code large enough to scan from across a
 * counter, the site's address for whoever would rather type it, and who is
 * presenting it. Always French and Arabic, whatever the admin reads in: it is
 * for the shops, not for us. The admin menu stays off this page so the
 * printer gets the card alone.
 */

type Props = { params: Promise<{ id: string }> };

export default async function RepresentativeCard(props: Props) {
  const gate = await adminGate();
  const { t, lang } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const detail = await repDetail(supabase, id);
  if (!detail) notFound();

  const r = growthCopy[lang].reps;
  const card = growthCopy.fr.reps;
  const cardAr = growthCopy.ar.reps;
  const svg = await repQrSvg(detail.rep.code);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/commerciaux/${id}`}
          className="inline-flex min-h-[40px] items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
          {detail.rep.name}
        </Link>
        <PrintButton label={r.print} />
      </div>

      <article
        dir="ltr"
        className="mx-auto flex w-full max-w-[420px] flex-col items-center rounded-3xl border border-border bg-white px-8 py-10 text-center text-[#111] shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a static logo on a page made to be printed */}
        <img src="/logo-ouaqt-dark-ink.png" alt="OUAQT" width={180} height={43} className="h-auto w-[180px]" />
        <p className="mt-6 text-lg font-semibold leading-snug">{card.cardHeading}</p>
        <p lang="ar" dir="rtl" className="mt-1 text-lg font-semibold leading-snug">
          {card.cardHeadingAr}
        </p>
        <div className="mt-6 aspect-square w-[260px] [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-4 text-sm">{card.cardScan}</p>
        <p className="mt-2 font-mono text-base font-semibold tracking-wide">www.ouaqt.com</p>
        <div className="mt-6 w-full border-t border-[#ddd] pt-4">
          <p className="text-sm">{fill(card.cardBy, { name: detail.rep.name })}</p>
          <p lang="ar" dir="rtl" className="mt-0.5 text-sm">
            {fill(cardAr.cardBy, { name: detail.rep.name })}
          </p>
          <p className="mt-2 font-mono text-xs tracking-[0.2em] text-[#555]">{detail.rep.code}</p>
        </div>
      </article>
    </div>
  );
}
