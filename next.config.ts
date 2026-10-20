import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// Static export for GitHub Pages. No server features (route handlers,
// rewrites, image optimization) so the same build can move to Vercel later.
// GitHub Pages project sites live under /<repo>; the workflow passes that path.
// Empty for a user site (<name>.github.io), a custom domain, or local dev.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  devIndicators: false,
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
