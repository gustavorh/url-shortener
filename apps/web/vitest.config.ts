import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Integration tests open real DB connections; keep them serial and patient.
    testTimeout: 20000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@cortala/schemas/v1": path.resolve(
        __dirname,
        "../../packages/schemas/src/v1.ts"
      ),
      "@cortala/schemas": path.resolve(
        __dirname,
        "../../packages/schemas/src/index.ts"
      ),
    },
  },
});
