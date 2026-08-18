import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // "server-only" throws by design when imported outside Next's own
      // bundler — stub it out so files that import it for defense-in-depth
      // (but whose actual logic doesn't touch anything Next-specific) can
      // still be unit tested. See test/empty-module.ts.
      "server-only": fileURLToPath(new URL("./test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
