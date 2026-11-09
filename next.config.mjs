/*
 * What a browser may load on these pages, and what may frame them.
 *
 * Everything the site uses is its own, apart from the database (the logos
 * and the payment screenshots in its storage), FormSubmit for the contact
 * form's fallback, and Vercel's toolbar on preview deployments. Scripts may
 * be inline because Next.js writes its own inline; they may not come from
 * anywhere else. WebAssembly and a worker are for the app preview, which
 * runs SQLite in the page. Production only: the dev server needs eval and
 * its own websocket.
 */
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
/*
 * Vercel's toolbar (vercel.live and its websocket) is for previews: the live
 * site has no reason to load anything from it, so production does not allow
 * it at all.
 */
const toolbar = process.env.VERCEL_ENV === "production" ? null : { script: " https://vercel.live", img: " https://vercel.live https://vercel.com", font: " https://vercel.live", connect: " https://vercel.live wss://ws-us3.pusher.com", frame: " https://vercel.live" };
const policy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${toolbar?.script ?? ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabase ? ` ${supabase.origin}` : ""}${toolbar?.img ?? ""}`,
  `font-src 'self' data:${toolbar?.font ?? ""}`,
  `connect-src 'self'${supabase ? ` ${supabase.origin} wss://${supabase.host}` : ""} https://formsubmit.co${toolbar?.connect ?? ""}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  `frame-src 'self'${toolbar?.frame ?? ""}`,
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const security = [
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: policy }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  /*
   * A page this site opens, or that opens it, cannot reach into its window:
   * the owner's session and the phone app's shop live on this origin.
   */
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

/*
 * Pages for owners and staff, never for a search result: the phone app, the
 * app the builder previews, the admin area, and the account and payment pages
 * (whose slug differs per language, lib/i18n/routes.ts). They already carry a
 * robots meta tag; saying it in the response too means a crawler sees it even
 * where the tag is streamed into the body (the payment page renders on every
 * request) or the file is not a page at all.
 */
const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

/*
 * Crawlers that get each page's <title>, canonical and robots tags inside
 * <head> before anything else, rather than streamed in after it. Next.js's
 * own list (next/dist/shared/lib/router/utils/html-bots.js) leaves out
 * Googlebot itself, which then reads the tags of a page rendered per request
 * only once it has run the page's JavaScript; the AI search crawlers, which
 * run none, are added for the same reason.
 */
const searchBots =
  /Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|PerplexityBot|CCBot/i;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  htmlLimitedBots: searchBots,
  // No need to announce the framework to every visitor.
  poweredByHeader: false,
  // This folder is the project, whatever lockfiles sit higher up on the machine.
  outputFileTracingRoot: import.meta.dirname,
  // Lint the builder and the shared app code too, not only Next's default folders.
  eslint: { dirs: ["app", "components", "lib", "builder", "app-ui"] },
  images: {
    // AVIF first: roughly a third smaller than WebP for these photos.
    formats: ["image/avif", "image/webp"],
  },
  /*
   * The phone app (public/app, built in the desktop repository). Its page is
   * /app/index.html, named in full: the phone keeps that page for when there
   * is no network, and a redirect cannot be followed then. /app and /app/
   * send there, keeping the #serial= a link may carry.
   */
  async redirects() {
    return [
      { source: "/app", destination: "/app/index.html", permanent: false },
      { source: "/app/", destination: "/app/index.html", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: security },
      { source: "/:area(app|app-preview|admin)/:rest*", headers: noindex },
      { source: "/:lang(fr|en|ar)/:page(compte|account|payer|pay)/:rest*", headers: noindex },
      {
        // The desktop app built for the builder's preview. Its files are named
        // after their contents, so a new build is a new name and the old one
        // can be kept for good.
        source: "/app-preview/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // The phone app's files are named after their contents, like the preview's.
        source: "/app/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Its page, its service worker and its manifests are asked for again
        // each time, so a new build reaches phones at their next opening.
        source: "/app/:file(index.html|sw.js|manifest.webmanifest|manifest-[a-z]+\\.webmanifest)",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        // Pictures change rarely, so let browsers keep them for a day and
        // keep showing the old one for a week while fetching a new one.
        source: "/:dir(images|og)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
