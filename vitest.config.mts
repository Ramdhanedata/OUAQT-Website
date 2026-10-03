import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  /* tsconfig leaves JSX to Next; a test that draws a component needs it turned into calls. */
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    include: ["builder/**/*.test.ts", "lib/**/*.test.ts", "app-ui/**/*.test.ts"],
  },
});
