import type { Metadata } from "next";
import { Cairo, Inter, Source_Serif_4 } from "next/font/google";
import { adminLanguage } from "@/builder/admin/language";
import type { ReactNode } from "react";
import "../globals.css";

/*
 * The admin area's own root layout.
 *
 * It has to open <html> and <body> itself. Everything the public site serves
 * lives under app/[lang], whose layout is the root for that branch; /admin
 * sits outside it, so without this the page is served as a fragment, the
 * scripts never load, and nothing on it works. That is not a theory: the sign
 * in button did nothing at all until this file grew a document around it.
 *
 * Staff read it in French, English or Arabic, chosen from the menu. Arabic
 * turns the whole document right to left and takes the same Arabic face as
 * the public site.
 */

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

/*
 * Staff read numbers here all day, and figures read best in a plain sans:
 * the admin area takes Inter for its Latin text, and Cairo, already a sans,
 * for Arabic. The public site keeps its serif.
 */
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const arabic = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "OUAQT admin",
  robots: { index: false, follow: false },
};

/*
 * Never cached. Everything under here is somebody's money or somebody's
 * business, and a cached page is a copy of that handed to whoever asks next.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const lang = await adminLanguage();
  const rtl = lang === "ar";
  return (
    <html
      lang={lang}
      dir={rtl ? "rtl" : "ltr"}
      className={`${serif.variable} ${sans.variable} ${arabic.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${rtl ? "font-arabic" : "[font-family:var(--font-sans),system-ui,sans-serif]"} bg-background antialiased`}
      >
        {/*
          * The menu is a fixed column on a wide screen. Pages that draw it
          * make room for it; the sign-in screen, which has no menu, does not.
          */}
        <div className="min-h-screen lg:has-[.admin-sidebar]:ps-64">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
