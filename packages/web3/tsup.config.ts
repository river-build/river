import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    outExtension: ({ format }) => ({
        js: format === 'esm' ? '.js' : '.cjs',
    }),
})
