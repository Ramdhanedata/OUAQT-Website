import type { Metadata } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/motion/page-transition";
import { getDictionary } from "@/lib/i18n";
import { isRtl, locales, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

// TODO(customize): swap for Geist (npm i geist) or General Sans via next/font/local
// for an even more distinctive headline typeface once you have a license/package.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Inter has no Arabic glyphs, so Arabic would fall back to a system font and
// look inconsistent. Noto Kufi Arabic keeps the same geometric feel.
const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: { lang: string };
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = params.lang as Locale;
  const dict = getDictionary(lang);

  return {
    title: dict.meta.siteTitle,
    description: dict.meta.siteDescription,
    metadataBase: new URL("https://ouaqt.com"),
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      url: `https://ouaqt.com/${lang}`,
      siteName: "OUAQT",
      locale: lang,
      type: "website",
    },
  };
}

export default function RootLayout({ children, params }: Props) {
  if (!locales.includes(params.lang as Locale)) notFound();

  const lang = params.lang as Locale;
  const dict = getDictionary(lang);
  const rtl = isRtl(lang);

  return (
    <html
      lang={lang}
      dir={rtl ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={rtl ? "font-arabic" : undefined}
    >
      <body className={`${inter.variable} ${notoKufi.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar dict={dict} lang={lang} />
          <main className="min-h-screen pt-16 sm:pt-20">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer dict={dict} lang={lang} />
        </ThemeProvider>
      </body>
    </html>
  );
}
