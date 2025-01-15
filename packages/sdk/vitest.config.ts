import { defineConfig, mergeConfig } from 'vitest/config'
import { rootConfig } from '../../vitest.config.mjs'
import { sdkRootConfig } from './vitest.sdk.rootConfig'

export default mergeConfig(
    sdkRootConfig,
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
        },
    }),
)
