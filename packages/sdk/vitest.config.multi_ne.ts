import { defineConfig, mergeConfig } from 'vitest/config'
import { sdkRootConfig } from './vitest.sdk.rootConfig'

export default mergeConfig(
    sdkRootConfig,
    defineConfig({
        test: {
            environment: 'happy-dom',
            env: {
                RIVER_ENV: 'local_multi_ne',
            },
            include: ['./src/tests/multi_ne/**/*.test.ts'],
            hookTimeout: 120_000,
            testTimeout: 120_000,
            setupFiles: './vitest.setup.ts',
        },
    }),
)
