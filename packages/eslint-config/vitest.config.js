import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["local-rules/**/*.test.js", "*.test.js"],
    environment: "node",
    // Each test lints with type information; under turbo's parallel test run a
    // single cold program build can exceed the 5s default.
    testTimeout: 20_000,
  },
});
