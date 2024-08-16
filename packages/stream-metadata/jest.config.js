export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
    '^.+\\.wasm$': 'jest-transform-stub',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@river-build)',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
		'@matrix-org/olm/olm.wasm': './tests/__mocks__/olm.wasm.js',  // Mock .wasm module
  },
};
