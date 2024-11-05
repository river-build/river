import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./dev/**/*.ts",
    // "./dev/**/*.json", // we're not bundling abi.json files, only abi.ts
    './deployments/**/*.ts',
    './deployments/**/*.json',
    './config/**/*.json',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  loader: {
    '.json': 'copy'
  },
})

