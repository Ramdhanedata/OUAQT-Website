import type { Config } from "tailwindcss";

// TODO(customize): Swap the accent color here to rebrand OUAQT's whole palette
// in one place. A couple of alternatives that keep the "quiet luxury" feel:
//   - Deep emerald:  { DEFAULT: "#10B981", foreground: "#04140F" }
//   - Electric lime: { DEFAULT: "#C4F042", foreground: "#101400" }
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        surface: "var(--surface)",
        accent: {
          DEFAULT: "#C9A961",
          foreground: "#0A0A0A",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        // Applied on <html> when the locale is Arabic. Source Serif has no
        // Arabic glyphs, so without this Arabic falls back to a system font.
        arabic: ["var(--font-arabic)", "var(--font-serif)", "serif"],
      },
      letterSpacing: {
        // Tailwind's default tracking-tight (-0.025em) is tuned for a
        // geometric sans and crushes a serif at display sizes. Every heading
        // already uses tracking-tight, so retuning it here fixes them all at
        // once rather than editing twenty files.
        tight: "-0.011em",
      },
      maxWidth: {
        container: "1200px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-16px) translateX(8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        float: "float 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
