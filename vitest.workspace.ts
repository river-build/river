import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
    // matches every package that has a vitest.config.ts file
    'packages/*/vitest.config.ts',
])
