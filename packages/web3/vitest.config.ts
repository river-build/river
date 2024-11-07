import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import { rootConfig } from '../../vitest.config.mjs'

export default mergeConfig(
    rootConfig,
    defineConfig({
        test: {
            fakeTimers: {
                toFake: [...configDefaults.fakeTimers.toFake, 'performance'],
            },
        },
    }),
)
