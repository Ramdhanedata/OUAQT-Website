import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/motion/page-transition";

// TODO(customize): swap for Geist (npm i geist) or General Sans via next/font/local
// for an even more distinctive headline typeface once you have a license/package.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const description =
  "OUAQT builds custom systems for businesses still running on paper, Excel, and WhatsApp — five live products across mining, pharmacy, hospitality, transport, and food service.";

export const metadata: Metadata = {
  title: "OUAQT — Custom systems for real business workflows",
  description,
  metadataBase: new URL("https://ouaqt.com"),
  openGraph: {
    title: "OUAQT — Custom systems for real business workflows",
    description,
    url: "https://ouaqt.com",
    siteName: "OUAQT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar />
          <main className="min-h-screen pt-16 sm:pt-20">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
