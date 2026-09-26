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
const policy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabase ? ` ${supabase.origin}` : ""} https://vercel.live https://vercel.com`,
  "font-src 'self' data: https://vercel.live",
  `connect-src 'self'${supabase ? ` ${supabase.origin} wss://${supabase.host}` : ""} https://formsubmit.co https://vercel.live wss://ws-us3.pusher.com`,
  "worker-src 'self' blob:",
  "frame-src 'self' https://vercel.live",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const security = [
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: policy }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No need to announce the framework to every visitor.
  poweredByHeader: false,
  // Lint the builder and the shared app code too, not only Next's default folders.
  eslint: { dirs: ["app", "components", "lib", "builder", "app-ui"] },
  images: {
    // AVIF first: roughly a third smaller than WebP for these photos.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: security },
      {
        // The desktop app built for the builder's preview. Its files are named
        // after their contents, so a new build is a new name and the old one
        // can be kept for good.
        source: "/app-preview/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
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
