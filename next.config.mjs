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
