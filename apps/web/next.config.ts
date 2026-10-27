import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CSV imports upload their files to a server action (the default cap is 1 MB).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // The prey size calculator was removed; keep old links and search results working.
  async redirects() {
    return [{ source: "/tools/prey-size", destination: "/tools", permanent: true }];
  },
  // No other site may show Reptilytics pages inside a frame.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
