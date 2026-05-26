import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  // React plugin handles JSX/TSX (apps/web/tsconfig.json sets jsx=preserve
  // for Next, which Vite/esbuild can't consume directly).
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    // Integration tests open real DB connections; keep them serial and patient.
    testTimeout: 20000,
    hookTimeout: 30000,
    // .claude/worktrees holds checkouts created by background agents; their
    // tests reference files that don't exist on this branch.
    exclude: ["**/node_modules/**", "**/.claude/**", "**/dist/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@cortala/schemas/v1": path.resolve(
        __dirname,
        "../../packages/schemas/src/v1.ts"
      ),
      "@cortala/schemas/webhooks": path.resolve(
        __dirname,
        "../../packages/schemas/src/webhooks.ts"
      ),
      "@cortala/schemas": path.resolve(
        __dirname,
        "../../packages/schemas/src/index.ts"
      ),
    },
  },
});
