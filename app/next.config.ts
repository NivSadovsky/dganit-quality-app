import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist ships a worker file it loads by relative path at runtime —
  // bundling it breaks that lookup (see poParser.ts), so let Node require()
  // it natively instead.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
