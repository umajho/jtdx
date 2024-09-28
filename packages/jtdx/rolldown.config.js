import { defineConfig } from "rolldown";

export default defineConfig([
  {
    input: "src/mod.ts",
    output: {
      format: "esm",
    },
  },
  {
    input: "src/mod.ts",
    output: {
      entryFileNames: "mod.min.js",
      format: "esm",
      minify: true,
    },
  },
]);
