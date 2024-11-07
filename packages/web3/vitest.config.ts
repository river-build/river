import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import { rootConfig } from '../../vitest.config'

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
