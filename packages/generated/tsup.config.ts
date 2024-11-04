import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./dev/**/*.ts",
    "./deployments/**/*.json"
  ],
  outDir: "./dist",
  format: ["esm"],
  dts: true,
});
