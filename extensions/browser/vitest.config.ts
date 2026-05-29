import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@linkly/schemas/v1": path.resolve(
        __dirname,
        "../../packages/schemas/src/v1.ts"
      ),
      "@linkly/schemas/webhooks": path.resolve(
        __dirname,
        "../../packages/schemas/src/webhooks.ts"
      ),
      "@linkly/schemas": path.resolve(
        __dirname,
        "../../packages/schemas/src/index.ts"
      ),
    },
  },
});
