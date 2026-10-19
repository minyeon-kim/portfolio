import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// Static export for GitHub Pages. No server features (route handlers,
// rewrites, image optimization) so the same build can move to Vercel later.
const nextConfig: NextConfig = {
  output: "export",
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
