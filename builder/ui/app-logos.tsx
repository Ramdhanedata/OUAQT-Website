import type { PaymentApp } from "@/builder/payment/apps";

/*
 * The payment apps' own logos, so an owner finds the one on his phone by
 * its picture before he reads a word (Adel, 2026-11-23).
 *
 * Cut from one picture of the apps, sharpened, never redrawn: each lives in
 * public/images/pay-apps. Beyond the five that have a receiving number, the
 * strip shows the other apps that send to it, since any of them will do.
 */

type Logo = { file: string; name: string; width: number; height: number };

/* width and height are the file's own, so the page keeps the room before it loads. */
const LOGOS: Record<PaymentApp | "amanty" | "gazapay" | "bcipay", Logo> = {
  bankily: { file: "bankily", name: "Bankily", width: 250, height: 160 },
  masrvi: { file: "masrvi", name: "Masrvi", width: 360, height: 160 },
  sedad: { file: "sedad", name: "SEDAD", width: 281, height: 160 },
  bimbank: { file: "bimbank", name: "BimBank", width: 360, height: 123 },
  click: { file: "click", name: "Click", width: 123, height: 160 },
  amanty: { file: "amanty", name: "Amanty", width: 285, height: 160 },
  gazapay: { file: "gazapay", name: "GazaPay", width: 360, height: 122 },
  bcipay: { file: "bcipay", name: "BCIpay", width: 360, height: 138 },
};

/* In the order of the picture they came from. */
const STRIP = ["bimbank", "sedad", "masrvi", "bankily", "amanty", "gazapay", "bcipay", "click"] as const;

function src(logo: Logo): string {
  return `/images/pay-apps/${logo.file}.webp`;
}

/* One app's logo, inside a button that already says its name. */
export function AppLogo({ app }: { app: PaymentApp }) {
  const logo = LOGOS[app];
  return (
    <span className="mb-2 flex h-12 items-center justify-center rounded-md bg-white px-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src(logo)} alt="" width={logo.width} height={logo.height} className="h-10 w-auto max-w-full object-contain" />
    </span>
  );
}

/* Every app the owner may send from, as white cards, the way the apps show themselves. */
export function AppLogos({ label }: { label: string }) {
  return (
    <ul aria-label={label} className="mt-3 grid grid-cols-4 gap-2">
      {STRIP.map((app) => {
        const logo = LOGOS[app];
        return (
          <li key={app} className="flex h-14 items-center justify-center rounded-lg border border-border bg-white p-2 sm:h-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(logo)} alt={logo.name} width={logo.width} height={logo.height} loading="lazy" className="max-h-full w-auto max-w-full object-contain" />
          </li>
        );
      })}
    </ul>
  );
}
