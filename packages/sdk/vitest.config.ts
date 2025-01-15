import { defineConfig, mergeConfig } from 'vitest/config'
import { rootConfig } from '../../vitest.config.mjs'
import wasm from 'vite-plugin-wasm'

export default mergeConfig(
    rootConfig,
    defineConfig({
        test: {
            environment: 'happy-dom',
            env: {
                RIVER_ENV: 'local_multi',
            },
            include: ['./src/tests/multi/**/*.test.ts', './src/tests/multi_v2/**/*.test.ts'],
            hookTimeout: 120_000,
            testTimeout: 120_000,
            setupFiles: './vitest.setup.ts',
            server: {
                deps: {
                    inline: ['@river-build/mls-rs-wasm'],
                },
            },
        },
        plugins: [wasm()],
    }),
)
