import type { Config } from "tailwindcss";

// TODO(customize): Swap the accent color here to rebrand OUAQT's whole palette
// in one place. A couple of alternatives that keep the "quiet luxury" feel:
//   - Deep emerald:  { DEFAULT: "#10B981", foreground: "#04140F" }
//   - Electric lime: { DEFAULT: "#C4F042", foreground: "#101400" }
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // The builder and the screens shared with the desktop app.
    "./builder/**/*.{ts,tsx}",
    "./app-ui/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // The builder switches from one-question-per-screen to questions
        // beside a live preview here, as the brief asks.
        wizard: "900px",
      },
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
        /*
         * What went wrong: a refused payment, a field to correct. Used by the
         * builder and the admin area from the start and never defined, so
         * every error read in plain black. A red that still reads on ivory.
         */
        destructive: "#B42318",
        /*
         * The desktop app's own tokens (src/tokens.css there), for the
         * builder's preview of it. The preview has to look like the app,
         * not like the website around it.
         */
        app: {
          background: "#f0eee6",
          surface: "#faf9f5",
          raised: "#fdfcf9",
          hover: "#e6e3d9",
          selected: "#dcd8cc",
          line: "#e0ddd3",
          strong: "#cfcbc0",
          ink: "#0a0a0a",
          ink2: "#3d3c38",
          ink3: "#5f5d57",
          gold: "#c9a961",
          "gold-ink": "#735c24",
          warning: "#8a5300",
          "warning-soft": "#f5e4c3",
          danger: "#b42318",
          "danger-soft": "#f6dad5",
          success: "#2e6b34",
          "success-soft": "#d9ead5",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        // Applied on <html> when the locale is Arabic. Source Serif has no
        // Arabic glyphs, so without this Arabic falls back to a system font.
        // Cairo is a sans, so Arabic reads modern while Latin stays serif.
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
        /* A receipt coming out of the printer, in the preview. */
        "print-out": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        /* A section the owner's last answer just changed. */
        "answer-glow": {
          "0%, 60%": { boxShadow: "inset 0 0 0 4px #c9a961" },
          "100%": { boxShadow: "inset 0 0 0 4px transparent" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        float: "float 12s ease-in-out infinite",
        "print-out": "print-out 0.9s ease-out both",
        "answer-glow": "answer-glow 2.4s ease-out both",
        "fade-in": "fade-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
