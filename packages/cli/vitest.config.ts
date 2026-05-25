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
      "@cortala/schemas/v1": path.resolve(
        __dirname,
        "../schemas/src/v1.ts"
      ),
      "@cortala/schemas/webhooks": path.resolve(
        __dirname,
        "../schemas/src/webhooks.ts"
      ),
      "@cortala/schemas": path.resolve(
        __dirname,
        "../schemas/src/index.ts"
      ),
    },
  },
});
