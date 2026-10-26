import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@voiceforge/shared": path.resolve(
        import.meta.dirname,
        "../../packages/shared/src/index.ts",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      VOICEFORGE_NO_LISTEN: "1",
    },
  },
});
