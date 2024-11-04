import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./dev/**/*.ts",
    "./dev/**/*.json",
    './deployments/**/*.ts',
    './deployments/**/*.json',
    './config/**/*.ts',
    './config/**/*.json',
  ],
  outDir: './dist',
  format: ['esm'],
  dts: true,
  esbuildOptions(options) {
      options.loader = {
          ...options.loader,
          '.json': 'copy', // Copy JSON files to the dist folder
      }
  },
})

