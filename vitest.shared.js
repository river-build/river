import { defineConfig } from 'vitest/config'

export const rootConfig = defineConfig({
    test: {
        environment: 'node',
        coverage: {
            all: false,
            reporter: process.env.CI ? ['lcov'] : ['text', 'json', 'html'],
            exclude: ['**/dist/**', '**/*.test.ts', '**/*.test-d.ts'],
        },
        globals: true,
        testTimeout: 120_000,
    },
})
