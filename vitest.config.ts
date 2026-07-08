import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests run in a plain Node environment — we only test server actions
// (src/actions) and utilities (src/lib), never React components. Restricting
// `include` to those two trees keeps component/UI code out of the test run by
// design; there's no DOM/jsdom setup because nothing here needs one.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "src/lib/**/*.{test,spec}.ts",
      "src/actions/**/*.{test,spec}.ts",
    ],
  },
  resolve: {
    // Mirror the tsconfig "@/*" -> "./src/*" path alias so tests import the same
    // way app code does.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
