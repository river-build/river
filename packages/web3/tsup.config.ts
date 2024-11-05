import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['./src/index.ts', './src/v3/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
})
