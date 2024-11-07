import { defineConfig, mergeConfig } from 'vitest/config'
import { rootConfig } from '../../vitest.shared'

export default mergeConfig(
    rootConfig,
    defineConfig({
        test: {
            setupFiles: ['./vitest.setup.ts'],
        },
    }),
)
