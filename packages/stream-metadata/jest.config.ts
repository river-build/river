import { resolve } from 'path';
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
	modulePathIgnorePatterns: ['/dist/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '@matrix-org/olm/olm.wasm': require.resolve('./tests/__mocks__/mock-wasm-file.js'),
  },
	setupFilesAfterEnv: [resolve('./jest.setup.ts')],
  testEnvironment: 'node',
	testPathIgnorePatterns: ['/dist/', '/node_modules/'],
	testTimeout: 10000, // Set global timeout of 10 seconds for all tests
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
    '^.+\\.wasm$': 'jest-transform-stub',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@river-build)',
  ],
	verbose: true,
};

export default config
