import { defineConfig, mergeConfig } from 'vitest/config'
import { rootConfig } from '../../vitest.config.mjs'
import wasm from 'vite-plugin-wasm'

export const sdkRootConfig = mergeConfig(
    rootConfig,
    defineConfig({
        test: {
            server: {
                deps: {
                    inline: ['@river-build/mls-rs-wasm'],
                },
            },
        },
        plugins: [wasm()],
    }),
)
