import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @voiceforge/shared ships raw TypeScript (see docs/decisions.md #4).
  transpilePackages: ["@voiceforge/shared"],
  // Pin the monorepo root so Next.js file tracing ignores stray lockfiles
  // above this directory (e.g. C:\Users\<user>\package-lock.json).
  outputFileTracingRoot: path.resolve(import.meta.dirname),
};

export default nextConfig;


export default nextConfig;
