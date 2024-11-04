import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./dev/**/*.ts",
    // "./dev/**/*.json",
    './deployments/**/*.ts',
    './deployments/**/*.json',
    './config/**/*.json',
  ],
  outDir: './dist',
  format: ['esm'],
  dts: true,
  clean: true,
  loader: {
    '.json': 'copy'
  },
})

