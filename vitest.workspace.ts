import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
    // matches every package that has a vitest.config.ts file
    'packages/*/vitest.config.ts',
    // TODO: group these tests
    {
        extends: './packages/sdk/vitest.config.ts',
        test: {
            name: 'sdk-ne',
            include: ['./packages/sdk/**/*.test.ts'],
            setupFiles: ['./packages/sdk/vitest.setup.ts'],
        },
    },
    {
        extends: './packages/sdk/vitest.config.ts',
        test: {
            name: 'sdk-ent',
            include: [
                './packages/sdk/**/*.test.entitlements.ts',
                './packages/sdk/**/*.test.entitlements-v2.ts',
            ],
            setupFiles: ['./packages/sdk/vitest.setup.ts'],
        },
    },
    {
        extends: './packages/sdk/vitest.config.ts',
        test: {
            name: 'sdk-ent-legacy',
            include: ['./packages/sdk/**/*.test.entitlements.ts'],
            setupFiles: ['./packages/sdk/vitest.setup.ts'],
        },
    },
])
