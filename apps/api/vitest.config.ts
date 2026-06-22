import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "../../packages/shared/src/**/*.test.ts"],
  },
});
