import { defineConfig } from 'tsup'
// import { wasmLoader } from 'esbuild-plugin-wasm'

export default defineConfig({
    entry: ['./src/index.ts'],
    outDir: './dist',
    format: ['esm'],
    clean: true,
    dts: true,

    // noExternal: [/(.*)/], // useful for testing locally
    // TODO: withRiver vite plugin (load olm wasm)
    // or at least point in README.md
    // loader: {
    //     '.wasm': 'file',
    // },
    // esbuildPlugins: [wasmLoader()],
    // esbuildOptions: (options) => {
    //     options.assetNames = '[name]'
    // },
})
