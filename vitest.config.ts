import { defineConfig } from "vitest/config";
// import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    // Use your aliases
    // alias: {
    //   "@common": path.resolve("."),
    // },
  },
});
