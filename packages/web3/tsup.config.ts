import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['./src/index.ts', './src/v3/index.ts'],
    outDir: './dist',
    format: ['esm'],
    clean: true,
    dts: true,
})
