import type { Metadata } from "next";
import { Cairo, Source_Serif_4 } from "next/font/google";
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
      className={`${serif.variable} ${arabic.variable}`}
      suppressHydrationWarning
    >
      <body className={`${rtl ? "font-arabic" : "font-serif"} antialiased`}>
        <div className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
          {children}
        </div>
      </body>
    </html>
  );
}
