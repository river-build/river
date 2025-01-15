import { defineConfig, mergeConfig } from 'vitest/config'
import { sdkRootConfig } from './vitest.sdk.rootConfig'

export default mergeConfig(
    sdkRootConfig,
    defineConfig({
        test: {
            environment: 'happy-dom',
            env: {
                USE_LEGACY_SPACES: 'true',
                RIVER_ENV: 'local_multi',
            },
            include: ['./src/tests/multi/**/*.test.ts'],
            hookTimeout: 120_000,
            testTimeout: 120_000,
            setupFiles: './vitest.setup.ts',
        },
    }),
)
