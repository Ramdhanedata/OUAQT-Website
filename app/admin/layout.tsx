import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
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
 * Staff read this in French or English, never Arabic, so there is one font
 * and no direction switch.
 */

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
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

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={serif.variable} suppressHydrationWarning>
      <body className="font-serif antialiased">
        <div className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
          {children}
        </div>
      </body>
    </html>
  );
}
